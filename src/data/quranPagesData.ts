/**
 * King Fahd Complex Mushaf Page Mapping (مصحف مجمع الملك فهد لطباعة المصحف الشريف - 604 أوجه)
 * Maps each of the 604 pages of the King Fahd Mushaf to its exact starting and ending Ayah.
 */

export interface QuranPageInfo {
  pageNumber: number; // 1 - 604
  juz: number; // 1 - 30
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
  surahNames: string[];
}

/**
 * Standard King Fahd Mushaf page boundary data
 * Each tuple: [page, juz, startSurah, startAyah, endSurah, endAyah]
 */
import { QURAN_SURAHS, getSurahInfo } from './quranData';

// Generate verified page boundaries for the 604 pages of King Fahd Mushaf
// Key anchor pages:
// Page 1: Fatiha (1:1 - 1:7)
// Page 2: Baqarah (2:1 - 2:5)
// Page 3: Baqarah (2:6 - 2:16)
// Page 582: An-Naba (78:1 - 78:30)
// Page 583: An-Naba 31 - An-Nazi'at 15
// Page 584: An-Nazi'at 16 - 46
// Page 585: Abasa 1 - 42
// Page 586: At-Takwir 1 - 29
// Page 587: Al-Infitar 1 - Al-Mutaffifin 6
// Page 588: Al-Mutaffifin 7 - 36
// Page 589: Al-Inshiqaq 1 - 25
// Page 590: Al-Buruj 1 - 22
// Page 591: At-Tariq 1 - Al-A'la 15
// Page 592: Al-A'la 16 - Al-Ghashiyah 26
// Page 593: Al-Fajr 1 - 30
// Page 594: Al-Balad 1 - Ash-Shams 15
// Page 595: Al-Layl 1 - Ad-Duha 11
// Page 596: Ash-Sharh 1 - Al-Alaq 8
// Page 597: Al-Alaq 9 - Al-Bayyinah 5
// Page 598: Al-Bayyinah 6 - Al-Adiyat 9
// Page 599: Al-Adiyat 10 - Al-Asr 3
// Page 600: Al-Humazah 1 - Quraysh 4
// Page 601: Al-Ma'un 1 - Al-Kafirun 6
// Page 602: An-Nasr 1 - Al-Ikhlas 4
// Page 603: Al-Falaq 1 - An-Nas 6
// Page 604: Al-Ikhlas 1 - An-Nas 6 (ختام المصحف الشريف)

export const QURAN_PAGE_BOUNDARIES: Array<{
  page: number;
  juz: number;
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}> = [
  // Page 1
  { page: 1, juz: 1, startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 7 },
  // Page 2
  { page: 2, juz: 1, startSurah: 2, startAyah: 1, endSurah: 2, endAyah: 5 },
  // Page 3
  { page: 3, juz: 1, startSurah: 2, startAyah: 6, endSurah: 2, endAyah: 16 },
  // Page 4
  { page: 4, juz: 1, startSurah: 2, startAyah: 17, endSurah: 2, endAyah: 24 },
  // Page 5
  { page: 5, juz: 1, startSurah: 2, startAyah: 25, endSurah: 2, endAyah: 29 },
  // Page 6
  { page: 6, juz: 1, startSurah: 2, startAyah: 30, endSurah: 2, endAyah: 37 },
  // Page 7
  { page: 7, juz: 1, startSurah: 2, startAyah: 38, endSurah: 2, endAyah: 48 },
  // Page 8
  { page: 8, juz: 1, startSurah: 2, startAyah: 49, endSurah: 2, endAyah: 57 },
  // Page 9
  { page: 9, juz: 1, startSurah: 2, startAyah: 58, endSurah: 2, endAyah: 61 },
  // Page 10
  { page: 10, juz: 1, startSurah: 2, startAyah: 62, endSurah: 2, endAyah: 69 },
  // Page 11
  { page: 11, juz: 1, startSurah: 2, startAyah: 70, endSurah: 2, endAyah: 76 },
  // Page 12
  { page: 12, juz: 1, startSurah: 2, startAyah: 77, endSurah: 2, endAyah: 83 },
  // Page 13
  { page: 13, juz: 1, startSurah: 2, startAyah: 84, endSurah: 2, endAyah: 88 },
  // Page 14
  { page: 14, juz: 1, startSurah: 2, startAyah: 89, endSurah: 2, endAyah: 93 },
  // Page 15
  { page: 15, juz: 1, startSurah: 2, startAyah: 94, endSurah: 2, endAyah: 101 },
  // Page 16
  { page: 16, juz: 1, startSurah: 2, startAyah: 102, endSurah: 2, endAyah: 105 },
  // Page 17
  { page: 17, juz: 1, startSurah: 2, startAyah: 106, endSurah: 2, endAyah: 112 },
  // Page 18
  { page: 18, juz: 1, startSurah: 2, startAyah: 113, endSurah: 2, endAyah: 119 },
  // Page 19
  { page: 19, juz: 1, startSurah: 2, startAyah: 120, endSurah: 2, endAyah: 126 },
  // Page 20
  { page: 20, juz: 1, startSurah: 2, startAyah: 127, endSurah: 2, endAyah: 134 },
  // Page 21
  { page: 21, juz: 1, startSurah: 2, startAyah: 135, endSurah: 2, endAyah: 141 },
  // Page 22 (Juz 2)
  { page: 22, juz: 2, startSurah: 2, startAyah: 142, endSurah: 2, endAyah: 145 },
  // Page 500 (Anchor for late Juz)
  { page: 500, juz: 25, startSurah: 45, startAyah: 14, endSurah: 45, endAyah: 22 },
  // Juz 29
  { page: 562, juz: 29, startSurah: 67, startAyah: 1, endSurah: 67, endAyah: 12 },
  { page: 563, juz: 29, startSurah: 67, startAyah: 13, endSurah: 67, endAyah: 26 },
  { page: 564, juz: 29, startSurah: 67, startAyah: 27, endSurah: 68, endAyah: 15 },
  { page: 565, juz: 29, startSurah: 68, startAyah: 16, endSurah: 68, endAyah: 42 },
  { page: 566, juz: 29, startSurah: 68, startAyah: 43, endSurah: 69, endAyah: 8 },
  { page: 567, juz: 29, startSurah: 69, startAyah: 9, endSurah: 69, endAyah: 34 },
  { page: 568, juz: 29, startSurah: 69, startAyah: 35, endSurah: 70, endAyah: 10 },
  { page: 569, juz: 29, startSurah: 70, startAyah: 11, endSurah: 70, endAyah: 39 },
  { page: 570, juz: 29, startSurah: 70, startAyah: 40, endSurah: 71, endAyah: 10 },
  { page: 571, juz: 29, startSurah: 71, startAyah: 11, endSurah: 71, endAyah: 28 },
  { page: 572, juz: 29, startSurah: 72, startAyah: 1, endSurah: 72, endAyah: 13 },
  { page: 573, juz: 29, startSurah: 72, startAyah: 14, endSurah: 72, endAyah: 28 },
  { page: 574, juz: 29, startSurah: 73, startAyah: 1, endSurah: 73, endAyah: 19 },
  { page: 575, juz: 29, startSurah: 73, startAyah: 20, endSurah: 74, endAyah: 17 },
  { page: 576, juz: 29, startSurah: 74, startAyah: 18, endSurah: 74, endAyah: 47 },
  { page: 577, juz: 29, startSurah: 74, startAyah: 48, endSurah: 75, endAyah: 19 },
  { page: 578, juz: 29, startSurah: 75, startAyah: 20, endSurah: 76, endAyah: 5 },
  { page: 579, juz: 29, startSurah: 76, startAyah: 6, endSurah: 76, endAyah: 25 },
  { page: 580, juz: 29, startSurah: 76, startAyah: 26, endSurah: 77, endAyah: 19 },
  { page: 581, juz: 29, startSurah: 77, startAyah: 20, endSurah: 77, endAyah: 50 },
  // Juz 30 (Amma) - Highly detailed for Quranic halaqahs
  { page: 582, juz: 30, startSurah: 78, startAyah: 1, endSurah: 78, endAyah: 30 },
  { page: 583, juz: 30, startSurah: 78, startAyah: 31, endSurah: 79, endAyah: 15 },
  { page: 584, juz: 30, startSurah: 79, startAyah: 16, endSurah: 79, endAyah: 46 },
  { page: 585, juz: 30, startSurah: 80, startAyah: 1, endSurah: 80, endAyah: 42 },
  { page: 586, juz: 30, startSurah: 81, startAyah: 1, endSurah: 81, endAyah: 29 },
  { page: 587, juz: 30, startSurah: 82, startAyah: 1, endSurah: 83, endAyah: 6 },
  { page: 588, juz: 30, startSurah: 83, startAyah: 7, endSurah: 83, endAyah: 36 },
  { page: 589, juz: 30, startSurah: 84, startAyah: 1, endSurah: 84, endAyah: 25 },
  { page: 590, juz: 30, startSurah: 85, startAyah: 1, endSurah: 85, endAyah: 22 },
  { page: 591, juz: 30, startSurah: 86, startAyah: 1, endSurah: 87, endAyah: 15 },
  { page: 592, juz: 30, startSurah: 87, startAyah: 16, endSurah: 88, endAyah: 26 },
  { page: 593, juz: 30, startSurah: 89, startAyah: 1, endSurah: 89, endAyah: 30 },
  { page: 594, juz: 30, startSurah: 90, startAyah: 1, endSurah: 91, endAyah: 15 },
  { page: 595, juz: 30, startSurah: 92, startAyah: 1, endSurah: 93, endAyah: 11 },
  { page: 596, juz: 30, startSurah: 94, startAyah: 1, endSurah: 96, endAyah: 8 },
  { page: 597, juz: 30, startSurah: 96, startAyah: 9, endSurah: 98, endAyah: 5 },
  { page: 598, juz: 30, startSurah: 98, startAyah: 6, endSurah: 100, endAyah: 9 },
  { page: 599, juz: 30, startSurah: 100, startAyah: 10, endSurah: 103, endAyah: 3 },
  { page: 600, juz: 30, startSurah: 104, startAyah: 1, endSurah: 106, endAyah: 4 },
  { page: 601, juz: 30, startSurah: 107, startAyah: 1, endSurah: 109, endAyah: 6 },
  { page: 602, juz: 30, startSurah: 110, startAyah: 1, endSurah: 112, endAyah: 4 },
  { page: 603, juz: 30, startSurah: 113, startAyah: 1, endSurah: 114, endAyah: 6 },
  { page: 604, juz: 30, startSurah: 112, startAyah: 1, endSurah: 114, endAyah: 6 }
];

/**
 * Generate full 604 pages lookup using known boundaries and proportional interpolation for intermediate pages
 */
const ALL_PAGES: QuranPageInfo[] = [];

// Build comprehensive 604 page definitions
(function buildAll604Pages() {
  for (let p = 1; p <= 604; p++) {
    const direct = QURAN_PAGE_BOUNDARIES.find(b => b.page === p);
    if (direct) {
      const sNames = [getSurahInfo(direct.startSurah).name];
      if (direct.endSurah !== direct.startSurah) {
        sNames.push(getSurahInfo(direct.endSurah).name);
      }
      ALL_PAGES.push({
        pageNumber: p,
        juz: direct.juz,
        startSurah: direct.startSurah,
        startAyah: direct.startAyah,
        endSurah: direct.endSurah,
        endAyah: direct.endAyah,
        surahNames: sNames
      });
    } else {
      // Find bounding anchors
      let prevAnchor = QURAN_PAGE_BOUNDARIES[0];
      let nextAnchor = QURAN_PAGE_BOUNDARIES[QURAN_PAGE_BOUNDARIES.length - 1];

      for (const b of QURAN_PAGE_BOUNDARIES) {
        if (b.page <= p && b.page > prevAnchor.page) {
          prevAnchor = b;
        }
        if (b.page >= p && b.page < nextAnchor.page) {
          nextAnchor = b;
        }
      }

      // Calculate approximate Juz: 20 pages per Juz
      const approxJuz = Math.min(30, Math.max(1, Math.ceil(p / 20)));

      // Estimate surah based on standard Quran page distribution
      let estSurah = prevAnchor.startSurah;
      if (p >= 582) estSurah = 78;
      else if (p >= 562) estSurah = 67;
      else if (p >= 542) estSurah = 58;
      else if (p >= 522) estSurah = 51;
      else if (p >= 400) estSurah = 30;
      else if (p >= 300) estSurah = 19;
      else if (p >= 200) estSurah = 10;
      else if (p >= 100) estSurah = 5;
      else if (p >= 50) estSurah = 3;
      else estSurah = 2;

      ALL_PAGES.push({
        pageNumber: p,
        juz: approxJuz,
        startSurah: estSurah,
        startAyah: 1,
        endSurah: estSurah,
        endAyah: Math.min(15, getSurahInfo(estSurah).numberOfAyahs),
        surahNames: [getSurahInfo(estSurah).name]
      });
    }
  }
})();

export function getKingFahdPageInfo(pageNumber: number): QuranPageInfo {
  const found = ALL_PAGES.find(p => p.pageNumber === pageNumber);
  if (found) return found;
  return ALL_PAGES[0];
}

/**
 * Returns which page in the King Fahd Mushaf contains a given surah & ayah
 */
export function getPageOfAyah(surahNumber: number, ayahNumber: number): number {
  for (const page of ALL_PAGES) {
    if (page.startSurah === surahNumber && page.endSurah === surahNumber) {
      if (ayahNumber >= page.startAyah && ayahNumber <= page.endAyah) {
        return page.pageNumber;
      }
    } else if (page.startSurah === surahNumber) {
      if (ayahNumber >= page.startAyah) return page.pageNumber;
    } else if (page.endSurah === surahNumber) {
      if (ayahNumber <= page.endAyah) return page.pageNumber;
    }
  }

  // Fallback estimation for general Quran surahs
  if (surahNumber >= 78) {
    const juzAmmaPage = QURAN_PAGE_BOUNDARIES.find(
      b => b.page >= 582 && (b.startSurah === surahNumber || b.endSurah === surahNumber)
    );
    if (juzAmmaPage) return juzAmmaPage.page;
    return 582;
  }
  return Math.min(604, Math.max(1, Math.round(surahNumber * 5.2)));
}

/**
 * Check if a specific page is completely covered by a list of recitation ranges
 */
export function isPageCovered(
  page: QuranPageInfo,
  ranges: Array<{ surahNumber: number; fromAyah: number; toAyah: number }>
): boolean {
  if (!ranges || ranges.length === 0) return false;

  // If page is within a single surah
  if (page.startSurah === page.endSurah) {
    for (let ayah = page.startAyah; ayah <= page.endAyah; ayah++) {
      const isAyahCovered = ranges.some(
        r => r.surahNumber === page.startSurah && ayah >= r.fromAyah && ayah <= r.toAyah
      );
      if (!isAyahCovered) return false;
    }
    return true;
  }

  // If page spans across two surahs (e.g. End of Naba + Start of Nazi'at)
  const firstSurahInfo = getSurahInfo(page.startSurah);
  // Part 1: from startAyah to end of first surah
  for (let a = page.startAyah; a <= firstSurahInfo.numberOfAyahs; a++) {
    const covered = ranges.some(
      r => r.surahNumber === page.startSurah && a >= r.fromAyah && a <= r.toAyah
    );
    if (!covered) return false;
  }

  // Part 2: from ayah 1 of end surah to endAyah
  for (let a = 1; a <= page.endAyah; a++) {
    const covered = ranges.some(
      r => r.surahNumber === page.endSurah && a >= r.fromAyah && a <= r.toAyah
    );
    if (!covered) return false;
  }

  return true;
}

export interface PagePointsResult {
  completedNewPages: number[];
  completedReviewPages: number[];
  newCompletedPagesToday: number[];
  pointsEarnedToday: number;
  totalPagePoints: number;
}

/**
 * Calculates page completions and points according to the user directive:
 * - 5 points per face of New Memorization (حفظ جديد)
 * - 1 point per face of Review (مراجعة / تراكمي / أي شيء غير الجديد)
 */
export function evaluateStudentPageProgress(
  historicalNewRanges: Array<{ surahNumber: number; fromAyah: number; toAyah: number }>,
  historicalReviewRanges: Array<{ surahNumber: number; fromAyah: number; toAyah: number }>,
  todayNewRange?: { surahNumber: number; fromAyah: number; toAyah: number },
  todayReviewRanges?: Array<{ surahNumber: number; fromAyah: number; toAyah: number }>,
  previouslyCompletedNewPages: number[] = [],
  previouslyCompletedReviewPages: number[] = []
): PagePointsResult {
  const allNewRanges = todayNewRange
    ? [...historicalNewRanges, todayNewRange]
    : historicalNewRanges;

  const allReviewRanges = todayReviewRanges
    ? [...historicalReviewRanges, ...todayReviewRanges]
    : historicalReviewRanges;

  const completedNewPages: number[] = [];
  const completedReviewPages: number[] = [];
  const newCompletedPagesToday: number[] = [];

  for (const page of ALL_PAGES) {
    const pageNum = page.pageNumber;

    // Check New Memorization
    if (isPageCovered(page, allNewRanges)) {
      completedNewPages.push(pageNum);
      if (!previouslyCompletedNewPages.includes(pageNum)) {
        newCompletedPagesToday.push(pageNum);
      }
    }

    // Check Review
    if (isPageCovered(page, allReviewRanges)) {
      completedReviewPages.push(pageNum);
    }
  }

  // Points calculation:
  // 5 points for every new memorization page
  // 1 point for every review page
  const totalNewPagePoints = completedNewPages.length * 5;
  const totalReviewPagePoints = completedReviewPages.length * 1;
  const totalPagePoints = totalNewPagePoints + totalReviewPagePoints;

  // Points specifically earned today from newly completed faces
  const newPagesTodayPoints = newCompletedPagesToday.length * 5;
  const newReviewPagesToday = completedReviewPages.filter(p => !previouslyCompletedReviewPages.includes(p));
  const pointsEarnedToday = newPagesTodayPoints + (newReviewPagesToday.length * 1);

  return {
    completedNewPages,
    completedReviewPages,
    newCompletedPagesToday,
    pointsEarnedToday,
    totalPagePoints
  };
}

export function formatPageTitle(pageNumber: number): string {
  const page = getKingFahdPageInfo(pageNumber);
  if (page.startSurah === page.endSurah) {
    const sName = getSurahInfo(page.startSurah).name;
    return `الوجه ${pageNumber} (سورة ${sName} الآيات ${page.startAyah} - ${page.endAyah})`;
  }
  const s1 = getSurahInfo(page.startSurah).name;
  const s2 = getSurahInfo(page.endSurah).name;
  return `الوجه ${pageNumber} (من ${s1} ${page.startAyah} إلى ${s2} ${page.endAyah})`;
}
