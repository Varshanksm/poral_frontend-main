const nodemailer = require('nodemailer');

// Create reusable transporter with proper configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // Use TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
        },
        debug: true, // Enable debug output
        logger: true // Log information
    });
};

// Email templates
const emailTemplates = {
    welcome: (name, email) => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: email,
        subject: 'Welcome to TCE CSBS Hackathon Portal',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Welcome to TCE CSBS Hackathon Portal</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${name},</p>
                    <p>Your registration has been successful! You can now log in to submit your hackathon details.</p>
                    <p><strong>Email:</strong> ${email}</p>
                    
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    hackathonSubmitted: (studentName, studentEmail, hackathonTitle) => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: 'Hackathon Submitted Successfully',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Hackathon Submitted</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your participation in <strong>${hackathonTitle}</strong> has been submitted successfully and is pending verification from your proctor.</p>
                    <p>You will receive an email notification once your submission is reviewed.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    hackathonStatusUpdate: (studentName, studentEmail, hackathonTitle, status, rejectionReason = '') => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: `Hackathon ${status}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${status === 'Approved' ? '#4caf50' : '#d32f2f'}; color: white; padding: 20px; text-align: center;">
                    <h2>Hackathon ${status}</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your participation in <strong>${hackathonTitle}</strong> has been <strong>${status}</strong>.</p>
                    ${status === 'Rejected' ? `<p style="color: #d32f2f;"><strong>Reason:</strong> ${rejectionReason}</p>` : '<p style="color: #4caf50;">Congratulations! Your hackathon participation has been verified.</p>'}
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    participationAlert: (studentName, studentEmail, credits) => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: 'Participation Alert - Action Required',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Participation Alert</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>This is to inform you that you have currently participated in <strong>${credits} hackathons</strong>.</p>
                    <p>Please submit your hackathon details at the earliest to avoid any issues.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    hackathonSubmitted: (studentName, studentEmail, hackathonTitle, eventType = 'Hackathon') => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: `${eventType} Submitted Successfully`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>${eventType} Submitted</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your participation in <strong>${hackathonTitle}</strong> has been submitted successfully and is pending verification from your proctor.</p>
                    <p>You will receive an email notification once your submission is reviewed.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    hackathonStatusUpdate: (studentName, studentEmail, hackathonTitle, status, rejectionReason = '', eventType = 'Hackathon') => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: `${eventType} ${status}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${status === 'Accepted' ? '#4caf50' : '#d32f2f'}; color: white; padding: 20px; text-align: center;">
                    <h2>${eventType} ${status}</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your participation in <strong>${hackathonTitle}</strong> has been <strong>${status}</strong>.</p>
                    ${status === 'Declined' ? `<p style="color: #d32f2f;"><strong>Reason:</strong> ${rejectionReason}</p>` : `<p style="color: #4caf50;">Congratulations! Your ${eventType.toLowerCase()} participation has been verified.</p>`}
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    hackathonReminder: (studentName, studentEmail) => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: 'Reminder: Submit Your Hackathon Details',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #830000; color: white; padding: 20px; text-align: center;">
                    <h2>Hackathon Participation Reminder</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p style="color: #d32f2f; font-weight: bold;">Our records show that you haven't submitted any hackathon details yet.</p>
                    <p>Please submit your hackathon participation details to complete your requirements.</p>
                    <p>If you have participated in any hackathons, please upload your certificates and details through the portal.</p>
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    newUpcomingHackathon: (studentName, studentEmail, hackathonTitle, organization, registrationDeadline) => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: `🚀 New Upcoming Hackathon: ${hackathonTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #830000, #a52a2a); color: white; padding: 20px; text-align: center;">
                    <h2>🚀 New Upcoming Hackathon!</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>We're excited to announce a new upcoming hackathon that you might be interested in!</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0; color: #830000;">${hackathonTitle}</h3>
                        <p><strong>Organization:</strong> ${organization}</p>
                        <p><strong>Registration Deadline:</strong> ${new Date(registrationDeadline).toLocaleDateString()}</p>
                    </div>
                    
                    <p>Visit the portal to view more details and enroll if you're interested!</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="#" style="background: #830000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            View Hackathon Details
                        </a>
                    </div>
                    
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    participationRequest: (proctorName, proctorEmail, studentName, hackathonTitle) => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: proctorEmail,
        subject: `  Participation Request: ${studentName} for ${hackathonTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #2196f3; color: white; padding: 20px; text-align: center;">
                    <h2>  New Participation Request</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${proctorName},</p>
                    <p>You have received a new participation request from a student for an upcoming hackathon.</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
                        <h3 style="margin-top: 0; color: #2196f3;">Request Details</h3>
                        <p><strong>Student:</strong> ${studentName}</p>
                        <p><strong>Hackathon:</strong> ${hackathonTitle}</p>
                        <p><strong>Status:</strong> Pending Approval</p>
                    </div>
                    
                    <p>Please log in to the portal to review and approve/decline this request.</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="#" style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            Review Request
                        </a>
                    </div>
                    
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    participationStatusUpdate: (studentName, studentEmail, hackathonTitle, status, rejectionReason = '') => ({
        from: '"TCE CSBS Hackathon Portal" <no-reply@portal.com>',
        to: studentEmail,
        subject: `Participation Request ${status}: ${hackathonTitle}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${status === 'Approved' ? '#4caf50' : '#d32f2f'}; color: white; padding: 20px; text-align: center;">
                    <h2>Participation Request ${status}</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your participation request for <strong>${hackathonTitle}</strong> has been <strong>${status}</strong>.</p>
                    ${status === 'Declined' ? `<p style="color: #d32f2f;"><strong>Reason:</strong> ${rejectionReason}</p>` : '<p style="color: #4caf50;">Congratulations! You can now participate in this hackathon.</p>'}
                    ${status === 'Approved' ? '<p>Remember to submit your certificate after completing the hackathon for verification.</p>' : ''}
                    
                    <hr style="margin: 20px 0;">
                    <div style="background: white; padding: 15px; border-left: 4px solid #830000;">
                        <h3 style="margin-top: 0;">Contact Information</h3>
                        <p><strong>Thiagarajar College of Engineering</strong></p>
                        <p>Madurai - 625 015</p>
                        <p>Tamil Nadu, India</p>
                        <p>📞 +91 452 2482240</p>
                        <p>🌐 www.tce.edu</p>
                    </div>
                </div>
            </div>
        `
    }),

    opportunityExposed: (studentName, studentEmail, oppTitle, link) => ({
        from: '"TCE CSBS Connect" <no-reply@portal.com>',
        to: studentEmail,
        subject: `✨ You Matched: ${oppTitle}`,
        html: `
             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #6a1b9a; color: white; padding: 20px; text-align: center;">
                    <h2>New Opportunity Match!</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>We found a new opportunity that matches your profile perfectly!</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6a1b9a;">
                        <h3 style="margin-top: 0; color: #6a1b9a;">${oppTitle}</h3>
                        <p>You have been selected based on your academic performance and skills.</p>
                    </div>

                    <p>Please log in to your dashboard to view details and mark your interest.</p>
                </div>
            </div>
        `
    }),

    opportunityNudge: (studentName, studentEmail, oppTitle) => ({
        from: '"TCE CSBS Connect" <no-reply@portal.com>',
        to: studentEmail,
        subject: `  Reminder: Interest Pending for ${oppTitle}`,
        html: `
             <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #ffa000; color: white; padding: 20px; text-align: center;">
                    <h2>Action Required</h2>
                </div>
                <div style="padding: 20px; background: #f9f9f9;">
                    <p>Dear ${studentName},</p>
                    <p>Your proctor is waiting for your response regarding:</p>
                    <h3 style="color: #333;">${oppTitle}</h3>
                    <p>Please confirm if you are interested or not on your dashboard.</p>
                </div>
            </div>
        `
    })
};

// Send email with retry logic
const sendEmail = async (emailOptions, retries = 3) => {
    const transporter = createTransporter();

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`Attempting to send email (attempt ${attempt}/${retries})...`);
            console.log('Email recipient:', emailOptions.to);
            console.log('Email subject:', emailOptions.subject);

            const info = await transporter.sendMail(emailOptions);

            console.log('Email sent successfully!');
            console.log('Message ID:', info.messageId);
            console.log('Response:', info.response);

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`Email sending failed (attempt ${attempt}/${retries}):`, error.message);

            if (attempt === retries) {
                console.error('All email sending attempts failed');
                console.error('Error details:', {
                    message: error.message,
                    code: error.code,
                    command: error.command
                });
                return { success: false, error: error.message };
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};

const sendEmailBatch = async (recipients, templateGenerator) => {
    console.log(`Starting batch email send to ${recipients.length} recipients...`);
    let count = 0;
    for (const recipient of recipients) {
        // templateGenerator(recipient) returns the email options
        const options = templateGenerator(recipient);
        const result = await sendEmail(options);
        if (result && result.success) count++;
    }
    console.log(`Batch send complete. Sent ${count}/${recipients.length}`);
    return count;
};

module.exports = {
    sendEmail,
    sendEmailBatch,
    emailTemplates
};
