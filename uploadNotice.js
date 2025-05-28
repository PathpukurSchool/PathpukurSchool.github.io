// netlify/functions/uploadNotice.js

const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    const notice = JSON.parse(event.body);

    // ফাইল সংরক্ষণ
    let fileLink = '';
    if (notice.file && notice.file.content) {
      const fileBuffer = Buffer.from(notice.file.content.split(',')[1], 'base64');
      const uploadsDir = path.join(__dirname, '..', '..', 'assets', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, notice.file.name);
      fs.writeFileSync(filePath, fileBuffer);
      fileLink = `/assets/uploads/${notice.file.name}`;
    }

    // student_notice.js আপডেট
    const noticeFilePath = path.join(__dirname, '..', '..', 'student_notice.js');
    let existingData = fs.readFileSync(noticeFilePath, 'utf-8');

    // নতুন নোটিশ অবজেক্ট
    const newNotice = {
      date: notice.date,
      text: notice.body,
      color: notice.color,
      link: fileLink,
    };

    // বিদ্যমান studentTableNotices অ্যারে খুঁজে বের করা
    const tableNoticesMatch = existingData.match(/const studentTableNotices = (\[.*?\]);/s);
    if (!tableNoticesMatch) {
      return {
        statusCode: 500,
        body: 'studentTableNotices array not found.',
      };
    }

    const tableNoticesArray = JSON.parse(tableNoticesMatch[1]);
    tableNoticesArray.unshift(newNotice); // নতুন নোটিশ শুরুতে যোগ করুন

    // studentTableNotices আপডেট
    const updatedTableNotices = `const studentTableNotices = ${JSON.stringify(tableNoticesArray, null, 2)};`;
    existingData = existingData.replace(/const studentTableNotices = \[.*?\];/s, updatedTableNotices);

    // studentNotices আপডেট (স্ক্রলিং নোটিশের জন্য)
    const scrollingNotice = {
      date: notice.date,
      text: notice.subject,
      color: notice.color,
    };

    const scrollingNoticesMatch = existingData.match(/const studentNotices = (\[.*?\]);/s);
    if (!scrollingNoticesMatch) {
      return {
        statusCode: 500,
        body: 'studentNotices array not found.',
      };
    }

    const scrollingNoticesArray = JSON.parse(scrollingNoticesMatch[1]);
    scrollingNoticesArray.unshift(scrollingNotice);

    const updatedScrollingNotices = `const studentNotices = ${JSON.stringify(scrollingNoticesArray, null, 2)};`;
    existingData = existingData.replace(/const studentNotices = \[.*?\];/s, updatedScrollingNotices);

    // ফাইল সংরক্ষণ
    fs.writeFileSync(noticeFilePath, existingData);

    return {
      statusCode: 200,
      body: 'নোটিশ সফলভাবে আপলোড হয়েছে।',
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `ত্রুটি: ${error.message}`,
    };
  }
};
