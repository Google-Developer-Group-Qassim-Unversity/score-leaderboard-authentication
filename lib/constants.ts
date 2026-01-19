// List of colleges at Qassim University
export const QU_COLLEGES = [
  "كلية الحاسب",
  "كلية الطب",
  "كلية طب الأسنان",
  "كلية الصيدلة",
  "كلية الهندسة",
  "كلية العلوم",
  "كلية العمارة والتخطيط",
  "كلية الزراعة والطب البيطري",
  "كلية الشريعة والدراسات الإسلامية",
  "كلية اللغة العربية والدراسات الاجتماعية",
  "كلية الاقتصاد والإدارة",
  "كلية العلوم الطبية التطبيقية",
  "كلية التمريض",
  "كلية التربية الدينية",
] as const

export type QUCollege = (typeof QU_COLLEGES)[number]

// University levels (1-10)
export const UNI_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const

export type UniLevel = (typeof UNI_LEVELS)[number]
