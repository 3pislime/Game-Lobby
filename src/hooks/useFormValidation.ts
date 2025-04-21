import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationState {
  [key: string]: {
    error: string | null;
    isDirty: boolean;
  };
}

export function useFormValidation<T extends Record<string, any>>(
  initialState: T,
  validationSchemas: Record<keyof T, z.ZodSchema>
) {
  const [formData, setFormData] = useState<T>(initialState);
  const [validationState, setValidationState] = useState<ValidationState>(
    Object.keys(initialState).reduce((acc, key) => ({
      ...acc,
      [key]: { error: null, isDirty: false }
    }), {})
  );

  const validateField = useCallback((name: keyof T, value: any) => {
    const schema = validationSchemas[name];
    const result = schema.safeParse(value);

    setValidationState(prev => ({
      ...prev,
      [name]: {
        error: !result.success ? result.error.errors[0].message : null,
        isDirty: true
      }
    }));

    return result.success;
  }, [validationSchemas]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name as keyof T, value);
  }, [validateField]);

  const validateForm = useCallback(() => {
    let isValid = true;
    const newValidationState = { ...validationState };

    Object.keys(formData).forEach(key => {
      const schema = validationSchemas[key as keyof T];
      const result = schema.safeParse(formData[key]);

      newValidationState[key] = {
        error: !result.success ? result.error.errors[0].message : null,
        isDirty: true
      };

      if (!result.success) isValid = false;
    });

    setValidationState(newValidationState);
    return isValid;
  }, [formData, validationSchemas, validationState]);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setValidationState(
      Object.keys(initialState).reduce((acc, key) => ({
        ...acc,
        [key]: { error: null, isDirty: false }
      }), {})
    );
  }, [initialState]);

  return {
    formData,
    validationState,
    handleChange,
    validateForm,
    resetForm,
    validateField
  };
}