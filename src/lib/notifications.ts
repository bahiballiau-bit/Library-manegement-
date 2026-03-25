/**
 * Notification Service
 * Handles sending SMS notifications via the backend API.
 */

export interface SMSPayload {
  to: string;
  message: string;
}

export const sendSMS = async (payload: SMSPayload): Promise<{ success: boolean; message: string; sid?: string }> => {
  try {
    const response = await fetch('/api/notify/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Failed to send SMS:', error);
    return { success: false, message: error.message || 'Failed to send SMS' };
  }
};

/**
 * Utility to format fee reminder message
 */
export const formatFeeReminder = (studentName: string, month: string, amount: number): string => {
  return `Dear Parent, this is a reminder that the library fee for ${studentName} for the month of ${month} (Amount: ₹${amount}) is due. Please pay at the earliest. Thank you!`;
};

/**
 * Utility to format attendance alert message
 */
export const formatAttendanceAlert = (studentName: string, date: string, entryTime: string): string => {
  return `Dear Parent, your ward ${studentName} has entered the library on ${date} at ${entryTime}. Thank you!`;
};

/**
 * Utility to format fee receipt message
 */
export const formatFeeReceipt = (studentName: string, amount: number, receiptNo: string): string => {
  return `Dear Parent, we have received ₹${amount} as library fee for ${studentName}. Receipt No: ${receiptNo}. Thank you!`;
};
