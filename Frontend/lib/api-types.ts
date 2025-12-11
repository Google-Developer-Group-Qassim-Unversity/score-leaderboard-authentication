// All Type Definitions - Single source of truth
// Edit this file when the API structure changes

// ===== API Response Types (from backend) =====

export interface ApiMember {
  id: number
  name: string
  points: number
  gender: string
}

export type ApiMembersResponse = ApiMember[]

export interface ApiDepartment {
  id: number
  name: string
  points: number
}

export interface ApiDepartmentsResponse {
  Specialized: ApiDepartment[]
  Administrative: ApiDepartment[]
}

export interface ApiEvent {
  event_name: string
  start_date: string
  end_date: string
  action_name: string
  original_points: number
  event_days: number
  absences?: number // Only for members
  attended_days?: number // Only for members
  points: number
}

export interface ApiMemberDetail {
  id: number
  name: string
  points: number
  events: ApiEvent[]
}

export interface ApiDepartmentDetail {
  id: number
  name: string
  points: number
  events: ApiEvent[]
}

// ===== Internal App Types (transformed from API) =====

export interface Member {
  id: string
  name: string
  totalPoints: number
  rank: number
  departmentId: string
  isManager: boolean
}

export interface Department {
  id: string
  name: string
  totalPoints: number
  rank: number
  type?: 'administrative' | 'practical'
}

export interface PointsHistoryEntry {
  id: string
  date: string
  source: "attended on-site course" | "on-site course"
  points: number
  entityId: string // member or department ID
  entityType: "member" | "department"
}

export interface LeaderboardSummary {
  topMembers: Member[]
  topDepartments: Department[]
  totalMembers: number
  totalDepartments: number
}

// ===== Events Types =====

export type EventStatus = "announced" | "open" | "closed"

export interface ApiEventItem {
  id: number
  name: string
  description: string | null
  location_type: "online" | "on-site" | "none"
  location: string
  start_datetime: string
  end_datetime: string
  status: EventStatus
  image_url: string | null
}

export type ApiEventsResponse = ApiEventItem[]

// ===== Forms Types =====

export interface FormQuestion {
  id: number
  value: string
  formId: number
}

export interface ApiEventForm {
  formId: number
  questions: FormQuestion[]
}

export interface FormResponseInput {
  questionId: number
  value: string
}

export interface FormSubmissionRequest {
  formId: number
  memberUniId: string
  responses: FormResponseInput[]
}

export interface FormSubmissionResponse {
  submission: {
    id: number
    memberId: number
    formId: number
  }
  responses: {
    submissionId: number
    questionId: number
    value: string
  }[]
}

// ===== Member Creation Types =====

export interface CreateMemberResponse {
  member: {
    id: number
    name: string
    email: string
    phone_number: string
    uni_id: number
    gender: "Male" | "Female"
  }
  already_exists: boolean
}
