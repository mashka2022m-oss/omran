import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Exam, ExamQuestion, ExamSubmission, GoogleOAuthConfig } from '../types';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

let inMemoryGoogleAccessToken: string | null = (() => {
  try {
    return sessionStorage.getItem('omran_google_token') || null;
  } catch (e) {
    return null;
  }
})();

export class GoogleWorkspaceService {
  static getCachedAccessToken(): string | null {
    return inMemoryGoogleAccessToken;
  }

  static setCachedAccessToken(token: string | null) {
    inMemoryGoogleAccessToken = token;
    try {
      if (token) {
        sessionStorage.setItem('omran_google_token', token);
      } else {
        sessionStorage.removeItem('omran_google_token');
      }
    } catch (e) {}
  }

  // Load persistent Google Account status from Firestore
  static async loadGoogleAuthConfig(): Promise<GoogleOAuthConfig> {
    try {
      const snap = await getDoc(doc(db, 'settings', 'google_oauth'));
      if (snap.exists()) {
        return snap.data() as GoogleOAuthConfig;
      }
    } catch (e) {
      console.warn('Could not load google auth config from Firestore:', e);
    }
    return { isLinked: false };
  }

  // Save persistent Google Account status to Firestore
  static async saveGoogleAuthConfig(config: GoogleOAuthConfig): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'google_oauth'), config);
    } catch (e) {
      console.error('Error saving google auth config:', e);
    }
  }

  // Link Supervisor Google Account with Google Forms and Sheets permissions
  static async linkGoogleAccount(): Promise<{ email: string; accessToken: string }> {
    const provider = new GoogleAuthProvider();
    GOOGLE_SCOPES.forEach(scope => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;

    if (!accessToken) {
      throw new Error('لم نتمكن من الحصول على رمز تفويض حساب Google.');
    }

    inMemoryGoogleAccessToken = accessToken;
    const email = result.user.email || 'حساب Google المتصل';

    const config: GoogleOAuthConfig = {
      connectedEmail: email,
      connectedAt: new Date().toISOString(),
      isLinked: true,
      lastSyncAt: new Date().toISOString()
    };

    await this.saveGoogleAuthConfig(config);
    return { email, accessToken };
  }

  // Create Google Form and linked Google Sheet for an Exam
  static async createGoogleFormAndSheet(exam: Exam, tokenOverride?: string): Promise<{
    formId: string;
    formEditUrl: string;
    responderUrl: string;
    spreadsheetId?: string;
    spreadsheetUrl?: string;
  }> {
    const token = tokenOverride || inMemoryGoogleAccessToken;
    if (!token) {
      throw new Error('يرجى تسجيل الدخول بحساب Google أولاً لإنشاء نموذج Google Form وجدول Google Sheets.');
    }

    // 1. Create Initial Google Form
    const createFormRes = await fetch('https://forms.googleapis.com/v1/forms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        info: {
          title: exam.title,
          documentTitle: `${exam.title} - منصة عمران القرآنية`
        }
      })
    });

    if (!createFormRes.ok) {
      const err = await createFormRes.text();
      throw new Error(`تعذر إنشاء نموذج Google Forms: ${err}`);
    }

    const formData = await createFormRes.json();
    const formId = formData.formId;
    const responderUrl = formData.responderUri || `https://docs.google.com/forms/d/e/${formId}/viewform`;
    const formEditUrl = `https://docs.google.com/forms/d/${formId}/edit`;

    // 2. Batch Update Form with Description, Settings, and Questions
    const requests: any[] = [
      {
        updateFormInfo: {
          info: {
            description: `${exam.description || 'اختبار في القرآن الكريم وعلومه'}\n\n* تم إنشاء هذا الاختبار عبر منصة عُمْرَان القرآنية\n* إجمالي الدرجات: ${exam.totalPoints} درجة`
          },
          updateMask: 'description'
        }
      }
    ];

    // Add Student Name & Halaqah identity field first
    requests.push({
      createItem: {
        item: {
          title: 'اسم الطالب الثلاثي',
          description: 'يرجى كتابة اسم الطالب المسجل في منصة عمران',
          questionItem: {
            question: {
              required: true,
              textQuestion: {
                paragraph: false
              }
            }
          }
        },
        location: {
          index: 0
        }
      }
    });

    // Add Each Exam Question
    exam.questions.forEach((q, idx) => {
      const questionIndex = idx + 1;
      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        const optionsList = q.options && q.options.length > 0
          ? q.options
          : q.type === 'true_false'
          ? ['صح', 'خطأ']
          : ['الخيار 1', 'الخيار 2'];

        requests.push({
          createItem: {
            item: {
              title: `${q.title} (${q.points} درجات)`,
              questionItem: {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: optionsList.map(opt => ({ value: opt })),
                    shuffle: false
                  }
                }
              }
            },
            location: {
              index: questionIndex
            }
          }
        });
      } else {
        // Essay / Short Answer / Text
        requests.push({
          createItem: {
            item: {
              title: `${q.title} (${q.points} درجات - سؤال كتابي)`,
              description: q.explanation ? `إرشاد: ${q.explanation}` : undefined,
              questionItem: {
                question: {
                  required: true,
                  textQuestion: {
                    paragraph: q.type === 'essay'
                  }
                }
              }
            },
            location: {
              index: questionIndex
            }
          }
        });
      }
    });

    const updateRes = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests
      })
    });

    if (!updateRes.ok) {
      console.warn('Batch update to Google Form produced a warning:', await updateRes.text());
    }

    // 3. Create Google Spreadsheet for responses
    let spreadsheetId: string | undefined;
    let spreadsheetUrl: string | undefined;

    try {
      const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `نتائج: ${exam.title} - منصة عمران`,
            locale: 'ar_SA'
          },
          sheets: [
            {
              properties: {
                title: 'التسليمات والدرجات',
                rightToLeft: true
              }
            }
          ]
        })
      });

      if (createSheetRes.ok) {
        const sheetData = await createSheetRes.json();
        spreadsheetId = sheetData.spreadsheetId;
        spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

        // Write header row
        const headers = [
          'اسم الطالب',
          'الحلقة',
          'رقم المحاولة',
          'تاريخ ووقت التسليم',
          'الدرجة المحصلة',
          'الدرجة القصوى',
          'النسبة المئوية',
          'نقاط لوحة الشرف',
          'حالة التصحيح',
          'ملاحظات المعلم'
        ];

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:J1?valueInputOption=USER_ENTERED`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: 'A1:J1',
            majorDimension: 'ROWS',
            values: [headers]
          })
        });
      }
    } catch (sheetErr) {
      console.warn('Could not create Google Sheet:', sheetErr);
    }

    return {
      formId,
      formEditUrl,
      responderUrl,
      spreadsheetId,
      spreadsheetUrl
    };
  }

  // Sync Submissions to Google Sheet
  static async syncSubmissionsToSheet(
    spreadsheetId: string,
    submissions: ExamSubmission[],
    tokenOverride?: string
  ): Promise<boolean> {
    const token = tokenOverride || inMemoryGoogleAccessToken;
    if (!token || !spreadsheetId) return false;

    try {
      const rows = submissions.map(sub => [
        sub.studentName,
        sub.halaqahName,
        `المحاولة ${sub.attemptNumber}`,
        new Date(sub.submittedAt).toLocaleString('ar-SA'),
        sub.totalScoreEarned,
        sub.maxPossibleScore,
        `${sub.percentage}%`,
        sub.pointsGrantedForLeaderboard,
        sub.status === 'completed' ? 'تم التصحيح والاعتماد' : 'بانتظار تصحيح المقالي',
        sub.teacherGeneralFeedback || ''
      ]);

      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range: 'A2',
            majorDimension: 'ROWS',
            values: rows
          })
        }
      );

      return appendRes.ok;
    } catch (e) {
      console.error('Error syncing to Google Sheet:', e);
      return false;
    }
  }

  // Import / Sync Responses directly from Google Form API
  static async importResponsesFromGoogleForm(
    exam: Exam,
    allStudents: { id: string; name: string; halaqahId?: string }[],
    existingSubmissions: ExamSubmission[] = [],
    tokenOverride?: string
  ): Promise<{ newCount: number; updatedCount: number; importedSubmissions: ExamSubmission[] }> {
    const token = tokenOverride || inMemoryGoogleAccessToken;
    if (!token) {
      throw new Error('يرجى تسجيل الدخول بحساب Google أولاً لمزامنة إجابات Google Forms.');
    }
    if (!exam.googleFormId) {
      throw new Error('هذا الاختبار غير مرتبط بنموذج Google Forms بعد.');
    }

    // 1. Fetch form metadata to map item IDs to questions
    const formMetaRes = await fetch(`https://forms.googleapis.com/v1/forms/${exam.googleFormId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!formMetaRes.ok) {
      throw new Error(`تعذر قراءة بيانات النموذج: ${await formMetaRes.text()}`);
    }
    const formMeta = await formMetaRes.json();
    const items: any[] = formMeta.items || [];

    // Map question title / itemId to exam question
    const questionMap: { [questionId: string]: { examQ: ExamQuestion; title: string } } = {};
    let studentNameQuestionId: string | null = null;

    items.forEach(item => {
      const qTitle = item.title || '';
      const qId = item.questionItem?.question?.questionId;
      if (!qId) return;

      if (qTitle.includes('اسم الطالب')) {
        studentNameQuestionId = qId;
      } else {
        // match with exam question
        const matched = exam.questions.find(
          eq => qTitle.includes(eq.title) || eq.title.includes(qTitle)
        );
        if (matched) {
          questionMap[qId] = { examQ: matched, title: qTitle };
        }
      }
    });

    // 2. Fetch responses
    const responsesRes = await fetch(`https://forms.googleapis.com/v1/forms/${exam.googleFormId}/responses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!responsesRes.ok) {
      throw new Error(`تعذر استيراد الردود من Google Forms: ${await responsesRes.text()}`);
    }
    const responsesData = await responsesRes.json();
    const responses: any[] = responsesData.responses || [];

    let newCount = 0;
    let updatedCount = 0;
    const importedSubmissions: ExamSubmission[] = [];

    for (const resp of responses) {
      const respId = resp.responseId;
      const submittedAt = resp.lastSubmittedTime || resp.createTime || new Date().toISOString();
      const answersObj = resp.answers || {};

      // Find student name from answers
      let studentName = '';
      if (studentNameQuestionId && answersObj[studentNameQuestionId]) {
        const textAnswers = answersObj[studentNameQuestionId].textAnswers?.answers || [];
        if (textAnswers.length > 0) {
          studentName = textAnswers[0].value?.trim() || '';
        }
      }

      // If not found in specific question, look in any text answer
      if (!studentName) {
        for (const qId of Object.keys(answersObj)) {
          const item = items.find(it => it.questionItem?.question?.questionId === qId);
          if (item?.title?.includes('اسم')) {
            const val = answersObj[qId].textAnswers?.answers?.[0]?.value?.trim();
            if (val) {
              studentName = val;
              break;
            }
          }
        }
      }

      if (!studentName) {
        studentName = `طالب (${respId.slice(0, 6)})`;
      }

      // Match student with registered students in database
      const matchedStudent = allStudents.find(
        st => st.name.trim().toLowerCase() === studentName.toLowerCase() ||
              st.name.includes(studentName) ||
              studentName.includes(st.name)
      );

      const studentId = matchedStudent?.id || `ext_${respId}`;
      const halaqahId = matchedStudent?.halaqahId || 'unassigned';

      // Parse answers
      const submissionAnswers: any[] = [];
      let totalEarned = 0;
      let hasEssayPending = false;

      exam.questions.forEach(q => {
        // Find corresponding answer in Google Form response
        let studentAnsText = '';
        for (const [formQId, qMeta] of Object.entries(questionMap)) {
          if (qMeta.examQ.id === q.id && answersObj[formQId]) {
            const txtAns = answersObj[formQId].textAnswers?.answers || [];
            studentAnsText = txtAns.map((a: any) => a.value).join(', ');
            break;
          }
        }

        const isAutoGraded = q.type === 'multiple_choice' || q.type === 'true_false';
        let isCorrect = false;
        let pointsEarned = 0;

        if (isAutoGraded && studentAnsText) {
          const expected = String(q.correctAnswer || '').trim().toLowerCase();
          const actual = studentAnsText.trim().toLowerCase();
          if (actual === expected) {
            isCorrect = true;
            pointsEarned = q.points;
          }
        } else if (q.type === 'essay') {
          hasEssayPending = true;
        }

        totalEarned += pointsEarned;

        submissionAnswers.push({
          questionId: q.id,
          questionTitle: q.title,
          questionType: q.type,
          studentAnswer: studentAnsText,
          isAutoGraded,
          isCorrect: isAutoGraded ? isCorrect : undefined,
          pointsEarned,
          maxPoints: q.points
        });
      });

      const maxPossibleScore = exam.totalPoints;
      const percentage = maxPossibleScore > 0 ? Math.round((totalEarned / maxPossibleScore) * 100) : 0;
      const pointsGrantedForLeaderboard = exam.grantsLeaderboardPoints ? totalEarned : 0;

      // Check if this response ID or student already has a submission
      const existingIdx = existingSubmissions.findIndex(
        s => s.id === `gform_${respId}` || (s.studentId === studentId && s.examId === exam.id && s.submittedAt === submittedAt)
      );

      const submissionData: ExamSubmission = {
        id: `gform_${respId}`,
        examId: exam.id,
        examTitle: exam.title,
        studentId,
        studentName: matchedStudent?.name || studentName,
        halaqahId,
        halaqahName: 'حلقة مسجلة',
        attemptNumber: 1,
        answers: submissionAnswers,
        totalScoreEarned: totalEarned,
        maxPossibleScore,
        percentage,
        status: hasEssayPending ? 'needs_grading' : 'completed',
        pointsGrantedForLeaderboard,
        submittedAt
      };

      if (existingIdx >= 0) {
        updatedCount++;
      } else {
        newCount++;
      }
      importedSubmissions.push(submissionData);
    }

    // Save to Firestore
    for (const sub of importedSubmissions) {
      await setDoc(doc(db, 'exam_submissions', sub.id), JSON.parse(JSON.stringify(sub)));
    }

    return {
      newCount,
      updatedCount,
      importedSubmissions
    };
  }

  // Export any Exam results / Student Submissions directly to a brand new Google Spreadsheet
  static async exportExamResultsToGoogleSheet(
    title: string,
    submissions: ExamSubmission[],
    tokenOverride?: string
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    const token = tokenOverride || inMemoryGoogleAccessToken;
    if (!token) {
      throw new Error('يرجى ربط وتفويض حساب Google أولاً لتصدير النتائج إلى Google Sheets.');
    }

    const createSheetRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: `نتائج: ${title} - منصة عُمْرَان القرآنية`,
          locale: 'ar_SA'
        },
        sheets: [
          {
            properties: {
              title: 'النتائج والتسليمات',
              rightToLeft: true
            }
          }
        ]
      })
    });

    if (!createSheetRes.ok) {
      const err = await createSheetRes.text();
      throw new Error(`تعذر إنشاء جدول Google Sheets: ${err}`);
    }

    const sheetData = await createSheetRes.json();
    const spreadsheetId = sheetData.spreadsheetId;
    const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    const headers = [
      'اسم الطالب',
      'الحلقة',
      'عنوان الاختبار',
      'رقم المحاولة',
      'تاريخ ووقت التسليم',
      'الدرجة المحصلة',
      'الدرجة القصوى',
      'النسبة المئوية',
      'نقاط لوحة الشرف',
      'حالة التصحيح',
      'ملاحظات المعلم وتوجيهاته'
    ];

    const rows = submissions.map(sub => [
      sub.studentName,
      sub.halaqahName || 'الحلقة',
      sub.examTitle,
      `المحاولة ${sub.attemptNumber}`,
      new Date(sub.submittedAt).toLocaleString('ar-SA'),
      sub.totalScoreEarned,
      sub.maxPossibleScore,
      `${sub.percentage}%`,
      sub.pointsGrantedForLeaderboard,
      sub.status === 'completed' ? 'تم الاعتماد' : 'بانتظار التصحيح',
      sub.teacherGeneralFeedback || ''
    ]);

    const valuesToInsert = [headers, ...rows];

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:K${valuesToInsert.length}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          range: `A1:K${valuesToInsert.length}`,
          majorDimension: 'ROWS',
          values: valuesToInsert
        })
      }
    );

    return { spreadsheetId, spreadsheetUrl };
  }
}

