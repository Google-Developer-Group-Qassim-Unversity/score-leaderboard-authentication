'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>

interface OnboardingFormProps {
  uniId: string
  onSubmit: (data: OnboardingFormValues) => void | Promise<void>
}

export function OnboardingForm({ uniId, onSubmit }: OnboardingFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      uni_id: uniId,
      fullArabicName: '',
      saudiPhone: '',
      gender: undefined,
      personalEmail: '',
    },
  })

  // Update uni_id when it changes
  React.useEffect(() => {
    if (uniId) {
      form.setValue('uni_id', uniId)
    }
  }, [uniId, form])

  const handleSubmit = async (data: OnboardingFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
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
