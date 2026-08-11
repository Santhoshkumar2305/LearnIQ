const nodemailer = require('nodemailer');
const dns = require('dns');

// Custom DNS lookup to strictly enforce IPv4 resolution inside Nodemailer connections
const ipv4Lookup = (hostname, options, callback) => {
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT, 10) || 465,
  secure: process.env.EMAIL_SECURE !== 'false', // defaults to secure true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  lookup: ipv4Lookup // Force strictly IPv4 connections (family 4)
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer SMTP Connection Error:', error);
  } else {
    console.log('✅ Nodemailer SMTP connection verified! Ready to transmit live notifications.');
  }
});

/**
 * Standard utility to send a generic email via Gmail SMTP
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Smart LMS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Live email transmitted to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Failed to send live email to ${to}:`, err);
    throw err;
  }
};

// --- Specialized Premium Email Templates ---

const sendNewMaterialEmail = async (studentEmail, studentName, courseTitle, materialTitle) => {
  const subject = `[New Material] Added in ${courseTitle}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #6d28d9; margin-bottom: 5px;">Smart Learning Management System</h2>
      <p style="font-size: 1rem; color: #64748b; margin-top: 0; margin-bottom: 20px;">New Study Resource Available</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>Your instructor has posted new educational material for your course <strong>${courseTitle}</strong>:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6d28d9; margin: 20px 0; font-size: 1.1rem; font-weight: bold;">
        ${materialTitle}
      </div>
      <p>Please log in to your dashboard to review this resource and take notes.</p>
      <p style="margin-top: 30px; font-size: 0.85rem; color: #94a3b8;">
        Best regards,<br/>Smart LMS Team
      </p>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject, text: `New material uploaded in ${courseTitle}: ${materialTitle}`, html });
};

const sendNewQuizEmail = async (studentEmail, studentName, courseTitle, quizTitle) => {
  const subject = `[New Quiz] Released for ${courseTitle}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #6d28d9; margin-bottom: 5px;">Smart Learning Management System</h2>
      <p style="font-size: 1rem; color: #64748b; margin-top: 0; margin-bottom: 20px;">Assessment Announcement</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>A new multiple-choice quiz has been published for your course <strong>${courseTitle}</strong>:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6d28d9; margin: 20px 0; font-size: 1.1rem; font-weight: bold;">
        ${quizTitle}
      </div>
      <p>Attempt this quiz to review your understanding of current topics.</p>
      <p style="margin-top: 30px; font-size: 0.85rem; color: #94a3b8;">
        Best regards,<br/>Smart LMS Team
      </p>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject, text: `New quiz released in ${courseTitle}: ${quizTitle}`, html });
};

const sendNewAssignmentEmail = async (studentEmail, studentName, courseTitle, assignmentTitle) => {
  const subject = `[New Assignment] Posted in ${courseTitle}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #6d28d9; margin-bottom: 5px;">Smart Learning Management System</h2>
      <p style="font-size: 1rem; color: #64748b; margin-top: 0; margin-bottom: 20px;">Homework Announcement</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>A new assignment has been posted for your course <strong>${courseTitle}</strong>:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6d28d9; margin: 20px 0; font-size: 1.1rem; font-weight: bold;">
        ${assignmentTitle}
      </div>
      <p>Check the instructions and submission deadlines on your active student panel.</p>
      <p style="margin-top: 30px; font-size: 0.85rem; color: #94a3b8;">
        Best regards,<br/>Smart LMS Team
      </p>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject, text: `New assignment posted in ${courseTitle}: ${assignmentTitle}`, html });
};

const sendNewSubmissionEmail = async (teacherEmail, teacherName, studentName, assignmentTitle) => {
  const subject = `[Student Submission] Homework submitted by ${studentName}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #06b6d4; margin-bottom: 5px;">Smart Learning Management System</h2>
      <p style="font-size: 1rem; color: #64748b; margin-top: 0; margin-bottom: 20px;">Grading Alert</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      <p>Hello <strong>${teacherName}</strong>,</p>
      <p>A student has submitted coursework for grading:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #06b6d4; margin: 20px 0;">
        Student: <strong>${studentName}</strong><br/>
        Assignment: <strong>${assignmentTitle}</strong>
      </div>
      <p>Review the submission and utilize AI evaluations on your teacher panel.</p>
      <p style="margin-top: 30px; font-size: 0.85rem; color: #94a3b8;">
        Best regards,<br/>Smart LMS Team
      </p>
    </div>
  `;
  return sendEmail({ to: teacherEmail, subject, text: `${studentName} submitted homework for assignment: ${assignmentTitle}`, html });
};

const sendGradeReleasedEmail = async (studentEmail, studentName, courseTitle, assignmentTitle, grade, maxPoints) => {
  const subject = `[Grade Released] Your submission for ${assignmentTitle} has been graded`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #10b981; margin-bottom: 5px;">Smart Learning Management System</h2>
      <p style="font-size: 1rem; color: #64748b; margin-top: 0; margin-bottom: 20px;">Grading Released</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      <p>Hello <strong>${studentName}</strong>,</p>
      <p>Your submission for the assignment <strong>${assignmentTitle}</strong> in course <strong>${courseTitle}</strong> has been evaluated:</p>
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #a7f3d0; margin: 20px 0; text-align: center;">
        <span style="font-size: 0.9rem; color: #047857; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 5px;">Awarded Score</span>
        <span style="font-size: 2.2rem; font-weight: 800; color: #065f46;">${grade} <span style="font-size: 1.2rem; font-weight: 400; color: #047857;">/ ${maxPoints}</span></span>
      </div>
      <p>Please log in to check comments and feedback from your instructor.</p>
      <p style="margin-top: 30px; font-size: 0.85rem; color: #94a3b8;">
        Best regards,<br/>Smart LMS Team
      </p>
    </div>
  `;
  return sendEmail({ to: studentEmail, subject, text: `Your grade for ${assignmentTitle} is: ${grade}/${maxPoints}`, html });
};

const sendVerificationEmail = async (email, name, code) => {
  const subject = `[Smart LMS] Please verify your email address`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #6d28d9; margin-bottom: 5px;">Smart Learning Management System</h2>
      <p style="font-size: 1rem; color: #64748b; margin-top: 0; margin-bottom: 20px;">Email Verification Required</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for registering at Smart LMS. To complete your registration and activate your account, please enter the following 6-digit verification code on the signup screen:</p>
      <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #6d28d9; margin: 20px 0; font-size: 1.8rem; font-weight: bold; letter-spacing: 0.2em; text-align: center; color: #6d28d9;">
        ${code}
      </div>
      <p>This code is valid for 10 minutes. If you did not register for this account, please ignore this email.</p>
      <p style="margin-top: 30px; font-size: 0.85rem; color: #94a3b8;">
        Best regards,<br/>Smart LMS Team
      </p>
    </div>
  `;
  return sendEmail({ to: email, subject, text: `Your email verification code is: ${code}`, html });
};

module.exports = {
  sendEmail,
  sendNewMaterialEmail,
  sendNewQuizEmail,
  sendNewAssignmentEmail,
  sendNewSubmissionEmail,
  sendGradeReleasedEmail,
  sendVerificationEmail
};
