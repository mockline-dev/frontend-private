'use client'

import { useState, useCallback, useMemo } from 'react'
import { UseFormReturn, ValidationRule } from '@/types/common'

interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T
  validationRules?: Partial<Record<keyof T, ValidationRule<T[keyof T]>>>
  onSubmit?: (values: T) => void | Promise<void>
}

/**
 * Custom hook for form state management with validation
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate a single field
  const validateField = useCallback((field: keyof T, value: T[keyof T]): string | null => {
    const rules = validationRules[field]
    if (!rules) return null

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${String(field)} is required`
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null
    }

    // String-specific validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `${String(field)} must be at least ${rules.minLength} characters`
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return `${String(field)} must be no more than ${rules.maxLength} characters`
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        return `${String(field)} format is invalid`
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return null
  }, [validationRules])

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    for (const field in values) {
      const error = validateField(field, values[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    }

    setErrors(newErrors)
    return isValid
  }, [values, validateField])

  // Handle field change
  const handleChange = useCallback((field: keyof T) => (value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate field if it was already touched
    if (touched[field]) {
      const error = validateField(field, value)
      if (error) {
        setErrors(prev => ({ ...prev, [field]: error }))
      }
    }
  }, [errors, touched, validateField])

  // Handle form submission
  const handleSubmit = useCallback((customOnSubmit?: (values: T) => void | Promise<void>) => 
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce((acc, key) => {
        acc[key as keyof T] = true
        return acc
      }, {} as Partial<Record<keyof T, boolean>>)
      setTouched(allTouched)

      // Validate form
      const isValid = validateForm()
      if (!isValid) return

      setIsSubmitting(true)
      try {
        const submitFn = customOnSubmit || onSubmit
        if (submitFn) {
          await submitFn(values)
        }
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }, [values, validateForm, onSubmit])

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  // Set field value programmatically
  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  // Set field error programmatically
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  // Compute if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && Object.keys(touched).length > 0
  }, [errors, touched])

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError
  }
}

// Validation helpers
export const validationRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address'
      }
      return null
    }
  },
  password: { 
    required: true, 
    minLength: 6,
    custom: (value: string) => {
      if (value && value.length < 6) {
        return 'Password must be at least 6 characters'
      }
      return null
    }
  },
  url: {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      if (value && !/^https?:\/\/.+/.test(value)) {
        return 'Please enter a valid URL'
      }
      return null
    }
  }
}