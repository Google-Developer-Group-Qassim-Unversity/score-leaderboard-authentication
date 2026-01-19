'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2, Lock } from 'lucide-react'
import { QU_COLLEGES, UNI_LEVELS } from '@/lib/constants'

// Form validation schema
const onboardingSchema = z.object({
  uni_id: z.string(), // No validation needed - extracted from email
  fullArabicName: z
    .string()
    .min(1, 'Full Arabic name is required')
    .regex(/^[\u0600-\u06FF\s]+$/, 'Name must be in Arabic characters only'),
  saudiPhone: z
    .string()
    .length(10, 'Phone number must be exactly 10 digits')
    .regex(/^05\d{8}$/, 'Phone number must start with 05 followed by 8 digits'),
  gender: z.enum(['Male', 'Female'], { required_error: 'Please select a gender' }),
  uniLevel: z
    .number({ required_error: 'Please select your level' })
    .min(1, 'Level must be between 1 and 10')
    .max(10, 'Level must be between 1 and 10'),
  uniCollegeSelection: z
    .string()
    .min(1, 'Please select your college'),
  uniCollegeOther: z.string().optional(),
  personalEmail: z
    .string()
    .email('Invalid email address')
    .refine(
      (email) => {
        const domain = email.split('@')[1]
        return domain !== 'qu.edu.sa'
      },
      { message: 'Personal email cannot be a @qu.edu.sa address' }
    ),
}).refine(
  (data) => {
    if (data.uniCollegeSelection === 'other') {
      return data.uniCollegeOther && data.uniCollegeOther.trim().length > 0
    }
    return true
  },
  {
    message: 'Please enter your college name',
    path: ['uniCollegeOther'],
  }
)

type FormValues = z.infer<typeof onboardingSchema>

// Transform form values to output values (with uni_college instead of selection/other)
export interface OnboardingFormValues {
  uni_id: string
  fullArabicName: string
  saudiPhone: string
  gender: 'Male' | 'Female'
  uniLevel: number
  uniCollege: string
  personalEmail: string
}

interface OnboardingFormProps {
  uniId: string
  onSubmit: (data: OnboardingFormValues) => void | Promise<void>
}

export function OnboardingForm({ uniId, onSubmit }: OnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      uni_id: uniId,
      fullArabicName: '',
      saudiPhone: '',
      gender: undefined,
      uniLevel: undefined,
      uniCollegeSelection: '',
      uniCollegeOther: '',
      personalEmail: '',
    },
  })

  const collegeSelection = form.watch('uniCollegeSelection')

  // Update uni_id when it changes
  React.useEffect(() => {
    if (uniId) {
      form.setValue('uni_id', uniId)
    }
  }, [uniId, form])

  const handleSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      // Transform to output format
      const outputData: OnboardingFormValues = {
        uni_id: data.uni_id,
        fullArabicName: data.fullArabicName,
        saudiPhone: data.saudiPhone,
        gender: data.gender,
        uniLevel: data.uniLevel,
        uniCollege: data.uniCollegeSelection === 'other' 
          ? data.uniCollegeOther! 
          : data.uniCollegeSelection,
        personalEmail: data.personalEmail,
      }
      await onSubmit(outputData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* UI ID Field - Auto-populated from email */}
        <FormField
          control={form.control}
          name="uni_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel dir="rtl">الرقم الجامعي</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    placeholder="444444444"
                    {...field}
                    disabled={true}
                    className="bg-muted/60 cursor-not-allowed text-muted-foreground border-dashed opacity-70"
                    dir="ltr"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border">
                    <Lock className="h-3 w-3" />
                    Auto-filled
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Full Arabic Name */}
        <FormField
          control={form.control}
          name="fullArabicName"
          render={({ field }) => (
            <FormItem>
              <FormLabel dir="rtl">الاسم الرباعي</FormLabel>
              <FormControl>
                <Input
                  placeholder="ابراهيم عبدالاله علي الحربي"
                  {...field}
                  disabled={isSubmitting}
                  dir="rtl"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Saudi Phone Number */}
        <FormField
          control={form.control}
          name="saudiPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel dir="rtl">رقم الجول</FormLabel>
              <FormControl>
                <Input
                  placeholder="05xxxxxxxx"
                  {...field}
                  maxLength={10}
                  disabled={isSubmitting}
                  dir="ltr"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender */}
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel dir="rtl">القسم</FormLabel>
              <FormControl>
                <RadioGroup
                  dir="rtl"
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                  disabled={isSubmitting}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Male" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer" dir="rtl">
                      طلاب
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Female" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer" dir="rtl">
                      طالبات
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* University Level */}
        <FormField
          control={form.control}
          name="uniLevel"
          render={({ field }) => (
            <FormItem dir='rtl'>
              <FormLabel >المستوى الدراسي</FormLabel>
              <FormControl>
                <NativeSelect
                  {...field}
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  disabled={isSubmitting}
                >
                  <NativeSelectOption value="" disabled>
                    اختر المستوى
                  </NativeSelectOption>
                  {UNI_LEVELS.map((level) => (
                    <NativeSelectOption key={level} value={level.toString()}>
                      {level}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* University College */}
        <FormField
          control={form.control}
          name="uniCollegeSelection"
          render={({ field }) => (
            <FormItem dir='rtl'>
              <FormLabel >الكلية</FormLabel>
              <FormControl>
                <NativeSelect
                  {...field}
                  disabled={isSubmitting}
                >
                  <NativeSelectOption value="" disabled>
                    اختر الكلية
                  </NativeSelectOption>
                  {QU_COLLEGES.map((college) => (
                    <NativeSelectOption key={college} value={college}>
                      {college}
                    </NativeSelectOption>
                  ))}
                  <NativeSelectOption value="other">أخرى</NativeSelectOption>
                </NativeSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Other College Input - shown when 'other' is selected */}
        {collegeSelection === 'other' && (
          <FormField
            control={form.control}
            name="uniCollegeOther"
            render={({ field }) => (
              <FormItem>
                <FormLabel dir="rtl">اسم الكلية</FormLabel>
                <FormControl>
                  <Input
                    placeholder="أدخل اسم كليتك"
                    {...field}
                    disabled={isSubmitting}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Personal Email */}
        <FormField
          control={form.control}
          name="personalEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel dir="rtl">البريد الشخصي</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@gmail.com"
                  {...field}
                  disabled={isSubmitting}
                  dir="ltr"
                />
              </FormControl>
              <FormDescription dir="rtl">
                البريد الشخصي وليس المنتهي بـ qu.edu.sa@
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Completing Registration...
            </>
          ) : (
            'Complete Registration'
          )}
        </Button>
      </form>
    </Form>
  )
}
