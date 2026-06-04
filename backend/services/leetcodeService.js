const axios = require('axios');

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const headers = {
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com',
  'Origin': 'https://leetcode.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

// ── Helper ──────────────────────────────────────────────────────────────────
async function gql(query, variables = {}) {
  const res = await axios.post(
    LEETCODE_GRAPHQL,
    { query, variables },
    { headers, timeout: 10000 }
  );
  if (res.data.errors) {
    const msg = res.data.errors.map(e => e.message).join(', ');
    throw new Error(`LeetCode GraphQL error: ${msg}`);
  }
  return res.data.data;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Get user profile + solved counts + ranking
 */
async function getUserProfile(username) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          userAvatar
          realName
          countryName
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
      allQuestionsCount {
        difficulty
        count
      }
    }
  `;
  const data = await gql(query, { username });
  if (!data.matchedUser) throw new Error(`LeetCode user "${username}" not found`);

  const acStats = data.matchedUser.submitStatsGlobal.acSubmissionNum;
  const findCount = (arr, diff) => (arr.find(x => x.difficulty === diff) || {}).count || 0;
  const allQ = data.allQuestionsCount;

  return {
    username: data.matchedUser.username,
    ranking: data.matchedUser.profile.ranking,
    avatar: data.matchedUser.profile.userAvatar,
    realName: data.matchedUser.profile.realName,
    country: data.matchedUser.profile.countryName,
    easySolved:   findCount(acStats, 'Easy'),
    mediumSolved: findCount(acStats, 'Medium'),
    hardSolved:   findCount(acStats, 'Hard'),
    totalSolved:  findCount(acStats, 'All'),
    easyTotal:    findCount(allQ, 'Easy'),
    mediumTotal:  findCount(allQ, 'Medium'),
    hardTotal:    findCount(allQ, 'Hard'),
    totalQuestions: findCount(allQ, 'All'),
  };
}

/**
 * Get submission calendar (heatmap) — returns raw JSON string
 */
async function getSubmissionCalendar(username) {
  const query = `
    query getCalendar($username: String!) {
      matchedUser(username: $username) {
        submissionCalendar
      }
    }
  `;
  const data = await gql(query, { username });
  if (!data.matchedUser) throw new Error(`LeetCode user "${username}" not found`);
  return data.matchedUser.submissionCalendar; // raw JSON string
}

/**
 * Get recent accepted submissions
 */
async function getRecentSubmissions(username, limit = 20) {
  const query = `
    query getRecentAC($username: String!, $limit: Int!) {
      recentAcSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
      }
    }
  `;
  const data = await gql(query, { username, limit });
  const list = data.recentAcSubmissionList || [];

  // Fetch difficulty for each submission via problem details
  const enriched = await Promise.allSettled(
    list.map(async (s) => {
      try {
        const detail = await getProblemDifficulty(s.titleSlug);
        return { ...s, difficulty: detail.difficulty, timestamp: parseInt(s.timestamp) };
      } catch {
        return { ...s, difficulty: 'Medium', timestamp: parseInt(s.timestamp) };
      }
    })
  );

  return enriched
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
}

/**
 * Get single problem difficulty by slug
 */
async function getProblemDifficulty(titleSlug) {
  const query = `
    query getProblem($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        difficulty
      }
    }
  `;
  const data = await gql(query, { titleSlug });
  return { difficulty: data.question?.difficulty || 'Medium' };
}

/**
 * Full sync: profile + calendar + recent AC submissions
 */
async function fullSync(username) {
  const [profile, calendar, recentAC] = await Promise.all([
    getUserProfile(username),
    getSubmissionCalendar(username),
    getRecentSubmissions(username, 20),
  ]);
  return { profile, calendar, recentAC };
}

module.exports = { getUserProfile, getSubmissionCalendar, getRecentSubmissions, fullSync };
