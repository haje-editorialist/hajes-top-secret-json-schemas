/**
 * @param {{inputData: InputData}}
 */
export default async function main({inputData}) {
  let ticketData = {};

  if (inputData.ticket_json) {
    ticketData = typeof inputData.ticket_json === 'string'
      ? JSON.parse(inputData.ticket_json)
      : inputData.ticket_json;
  }

  // Block-level tags: opening or closing produces a paragraph break.
  const BLOCK_TAGS = new Set([
    'p','div','h1','h2','h3','h4','h5','h6','li','tr','td','th',
    'blockquote','table','thead','tbody','tfoot','section','article',
    'header','footer','aside','nav','main','pre','dd','dt','dl',
    'ol','ul','hr','form','fieldset','address','figure','figcaption'
  ]);

  // Inline-level tags: stripped without adding whitespace, so adjacent
  // characters stay adjacent. Prevents "Hi Maria ," and "fee s" artifacts
  // caused by inline tags wrapping variable substitutions or word fragments.
  const INLINE_TAGS = new Set([
    'span','b','strong','i','em','u','mark','small','big','sub','sup',
    'code','kbd','samp','tt','abbr','acronym','cite','dfn','q','var',
    'bdo','bdi','font','ins','del','s','strike','time','wbr','o:p'
  ]);

  // Clean HTML: drop noise blocks, preserve paragraph boundaries, strip
  // inline-formatting tags without adding whitespace, keep anchor tags,
  // decode entities, normalize whitespace.
  const cleanDescription = (html) => {
    if (!html) return '';
    return html
      // Drop entire noise blocks (content + tags) and HTML comments
      .replace(/<(style|script|head|iframe|noscript|title)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      // <br> → newline
      .replace(/<br\s*\/?>/gi, '\n')
      // Dispatch every other tag by classification
      .replace(/<\/?([a-zA-Z][a-zA-Z0-9:-]*)\b[^>]*>/g, (match, tag) => {
        const t = tag.toLowerCase();
        if (t === 'a') return match;           // preserve anchors verbatim
        if (INLINE_TAGS.has(t)) return '';     // inline → empty
        if (BLOCK_TAGS.has(t)) return '\n\n';  // block → paragraph break
        return ' ';                            // unknown → safe space
      })
      // Decode entities — named + numeric (decimal + hex)
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      // Invisible chars → space (not deleted) so they don't glue adjacent words
      .replace(/[​-‍؜﻿­]/g, ' ')
      // Normalize whitespace, preserving paragraph breaks
      .replace(/[ \t]+/g, ' ')
      .replace(/ ?\n ?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  // Open-to-close duration in hours (tenths). Only computed for resolved (4)
  // or closed (5) tickets — for open/pending tickets, updated_at is the most
  // recent activity rather than a true close time, so we return null.
  const computeOpenToCloseHours = (created, updated, status) => {
    if (!created || !updated) return null;
    if (status !== 4 && status !== 5) return null;
    const start = new Date(created);
    const end = new Date(updated);
    if (isNaN(start) || isNaN(end)) return null;
    return Math.round(((end - start) / 3600000) * 10) / 10;
  };

  // Parse conversations — keep both public replies and internal notes, but
  // prefix each body with a label so the v11 prompt can distinguish them.
  // The AI uses [INTERNAL NOTE] entries for context only, not for grading.
  const conversations = (ticketData.conversations || []).map(conv => {
    const label = conv.private ? '[INTERNAL NOTE]' : '[PUBLIC REPLY]';
    return {
      conversationId: conv.id || null,
      conversationAuthor: conv.user ? (conv.user.name || conv.user.email || null) : (conv.actor_name || null),
      conversationBody: label + '\n' + cleanDescription(conv.body || ''),
      conversationSource: conv.source || null,
      conversationPrivate: conv.private || false,
      conversationCreatedAt: conv.created_at || null,
      conversationUpdatedAt: conv.updated_at || null
    };
  });

  // Extract relevant fields from the ticket data
  return {
    ticketId: ticketData.id || null,
    ticketSubject: ticketData.subject || null,
    ticketStatus: ticketData.status || null,
    ticketDescription: ticketData.description || null,
    ticketCreatedAt: ticketData.created_at || null,
    ticketUpdatedAt: ticketData.updated_at || null,
    ticketPriority: ticketData.priority || null,
    ticketRequester: ticketData.requester ? ticketData.requester.name || null : null,
    ticketAssignee: ticketData.assignee ? ticketData.assignee.name || null : null,
    ticketGroup: ticketData.group ? ticketData.group.name || null : null,
    ticketSource: ticketData.source || null,
    ticketType: ticketData.type || null,
    cleanedDescription: cleanDescription(ticketData.description || ''),
    timeFromOpenToCloseHours: computeOpenToCloseHours(ticketData.created_at, ticketData.updated_at, ticketData.status),
    conversations: conversations
  };
}
