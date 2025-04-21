import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { AlertCircle, Loader, Send } from 'lucide-react';

interface FormData {
  question: string;
  answer: string;
}

interface ValidationErrors {
  question?: string;
  answer?: string;
}

export function QuestionForm() {
  const { socket, gameState } = useSocket();
  const [formData, setFormData] = useState<FormData>({
    question: '',
    answer: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string | null;
  }>({ type: null, message: null });

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (formData.question.length < 10) {
      newErrors.question = 'Question must be at least 10 characters long';
    }

    if (formData.answer.length < 2) {
      newErrors.answer = 'Answer must be at least 2 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation
  useEffect(() => {
    if (formData.question || formData.answer) {
      validateForm();
    }
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus({ type: null, message: null });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!socket || !gameState.currentSession) {
        throw new Error('No active session');
      }

      socket.emit('submit_question', {
        sessionId: gameState.currentSession.id,
        ...formData
      });

      // Wait for confirmation
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 5000)
      );

      const confirmation = new Promise<void>((resolve) => {
        socket.once('question_confirmed', () => resolve());
      });

      await Promise.race([confirmation, timeout]);

      setSubmitStatus({
        type: 'success',
        message: 'Question submitted successfully!'
      });
      setFormData({ question: '', answer: '' });
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit question'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 &&
    formData.question.length >= 10 &&
    formData.answer.length >= 2;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-white">Submit New Question</h2>

      {submitStatus.message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center ${
            submitStatus.type === 'success'
              ? 'bg-green-500/20 border border-green-500 text-green-500'
              : 'bg-red-500/20 border border-red-500 text-red-500'
          }`}
        >
          <AlertCircle className="w-5 h-5 mr-2" />
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="question"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Question
          </label>
          <textarea
            id="question"
            value={formData.question}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, question: e.target.value }))
            }
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.question ? 'border border-red-500' : ''
            }`}
            placeholder="Enter your question (min 10 characters)"
            rows={3}
            disabled={isSubmitting}
          />
          {errors.question && (
            <p className="mt-1 text-sm text-red-500">{errors.question}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="answer"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Answer
          </label>
          <input
            type="text"
            id="answer"
            value={formData.answer}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, answer: e.target.value }))
            }
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.answer ? 'border border-red-500' : ''
            }`}
            placeholder="Enter the answer (min 2 characters)"
            disabled={isSubmitting}
          />
          {errors.answer && (
            <p className="mt-1 text-sm text-red-500">{errors.answer}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Question
            </>
          )}
        </button>
      </form>
    </div>
  );
}