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
import { useTranslation, useLanguage } from '@/lib/i18n/client'

// College name translations (official names from Qassim University website)
const COLLEGE_TRANSLATIONS: Record<string, string> = {
  "كلية الحاسب": "College of Computer",
  "كلية الطب": "College of Medicine",
  "كلية طب الأسنان": "College of Dentistry",
  "كلية الصيدلة": "College of Pharmacy",
  "كلية الهندسة": "College of Engineering",
  "كلية العلوم": "College of Science",
  "كلية العمارة والتخطيط": "College of Architecture and Planning",
  "كلية الزراعة والطب البيطري": "College of Agriculture and Food",
  "كلية الشريعة والدراسات الإسلامية": "College of Shari'ah",
  "كلية اللغة العربية والدراسات الاجتماعية": "College of Languages and Humanities",
  "كلية الاقتصاد والإدارة": "College of Business and Economics",
  "كلية العلوم الطبية التطبيقية": "College of Applied Medical Sciences",
  "كلية التمريض": "College of Nursing",
  "كلية التربية الدينية": "College of Education",
}

// Form validation schema
const createOnboardingSchema = (t: (key: string) => string) => z.object({
  uni_id: z.string(), // No validation needed - extracted from email
  fullArabicName: z
    .string()
    .min(1, t('onboarding.validation.fullName.required'))
    .regex(/^[\u0600-\u06FF\s]+$/, t('onboarding.validation.fullName.arabicOnly')),
  saudiPhone: z
    .string()
    .length(10, t('onboarding.validation.phone.length'))
    .regex(/^05\d{8}$/, t('onboarding.validation.phone.format')),
  gender: z.enum(['Male', 'Female'], { required_error: t('onboarding.validation.gender.required') }),
  uniLevel: z
    .number({ required_error: t('onboarding.validation.level.required') })
    .min(1, t('onboarding.validation.level.min'))
    .max(10, t('onboarding.validation.level.max')),
  uniCollegeSelection: z
    .string()
    .min(1, t('onboarding.validation.college.required')),
  uniCollegeOther: z.string().optional(),
  personalEmail: z
    .string()
    .email(t('onboarding.validation.email.invalid'))
    .refine(
      (email) => {
        const domain = email.split('@')[1]
        return domain !== 'qu.edu.sa'
      },
      { message: t('onboarding.validation.email.notQuEmail') }
    ),
}).refine(
  (data) => {
    if (data.uniCollegeSelection === 'other') {
      return data.uniCollegeOther && data.uniCollegeOther.trim().length > 0
    }
    return true
  },
  {
    message: t('onboarding.validation.collegeOther.required'),
    path: ['uniCollegeOther'],
  }
)

type OnboardingSchema = ReturnType<typeof createOnboardingSchema>
type FormValues = z.infer<OnboardingSchema>

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
  const { t } = useTranslation()
  const { isRTL, language } = useLanguage()

  // Create schema with current translations
  const onboardingSchema = React.useMemo(() => createOnboardingSchema(t), [t])

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
              <FormLabel dir={isRTL ? 'rtl' : 'ltr'}>{t('onboarding.uniId.label')}</FormLabel>
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
                    {t('onboarding.uniId.autoFilled')}
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
              <FormLabel dir={isRTL ? 'rtl' : 'ltr'}>{t('onboarding.fullName.label')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('onboarding.fullName.placeholder')}
                  {...field}
                  disabled={isSubmitting}
                  dir={isRTL ? 'rtl' : 'ltr'}
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
              <FormLabel dir={isRTL ? 'rtl' : 'ltr'}>{t('onboarding.phone.label')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('onboarding.phone.placeholder')}
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
              <FormLabel dir={isRTL ? 'rtl' : 'ltr'}>{t('onboarding.gender.label')}</FormLabel>
              <FormControl>
                <RadioGroup
                  dir={isRTL ? 'rtl' : 'ltr'}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                  disabled={isSubmitting}
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Male" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer" dir={isRTL ? 'rtl' : 'ltr'}>
                      {t('onboarding.gender.male')}
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Female" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer" dir={isRTL ? 'rtl' : 'ltr'}>
                      {t('onboarding.gender.female')}
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
            <FormItem dir={isRTL ? 'rtl' : 'ltr'}>
              <FormLabel>{t('onboarding.level.label')}</FormLabel>
              <FormControl>
                <NativeSelect
                  {...field}
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  disabled={isSubmitting}
                >
                  <NativeSelectOption value="" disabled>
                    {t('onboarding.level.placeholder')}
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
            <FormItem dir={isRTL ? 'rtl' : 'ltr'}>
              <FormLabel>{t('onboarding.college.label')}</FormLabel>
              <FormControl>
                <NativeSelect
                  {...field}
                  disabled={isSubmitting}
                >
                  <NativeSelectOption value="" disabled>
                    {t('onboarding.college.placeholder')}
                  </NativeSelectOption>
                  {QU_COLLEGES.map((college) => (
                    <NativeSelectOption key={college} value={college}>
                      {language === 'ar' ? college : (COLLEGE_TRANSLATIONS[college] || college)}
                    </NativeSelectOption>
                  ))}
                  <NativeSelectOption value="other">{t('onboarding.college.other')}</NativeSelectOption>
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
                <FormLabel dir={isRTL ? 'rtl' : 'ltr'}>{t('onboarding.collegeOther.label')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('onboarding.collegeOther.placeholder')}
                    {...field}
                    disabled={isSubmitting}
                    dir={isRTL ? 'rtl' : 'ltr'}
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
              <FormLabel dir={isRTL ? 'rtl' : 'ltr'}>{t('onboarding.email.label')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t('onboarding.email.placeholder')}
                  {...field}
                  disabled={isSubmitting}
                  dir="ltr"
                />
              </FormControl>
              <FormDescription dir={isRTL ? 'rtl' : 'ltr'}>
                {t('onboarding.email.description')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('onboarding.submitting')}
            </>
          ) : (
            t('onboarding.submit')
          )}
        </Button>
      </form>
    </Form>
  )
}
