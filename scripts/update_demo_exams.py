import sqlite3
import json
import time
import os

db_path = os.path.join(os.path.dirname(__file__), '../packages/database/prisma/dev.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

now = int(time.time() * 1000)
start_time = now - (15 * 60 * 1000) # 15 mins ago
end_time = now + (180 * 60 * 1000)  # 3 hours from now

print('Updating existing exams timestamps to be LIVE now...')

policy_config = json.dumps({
  "requireCamera": True,
  "requireMicrophone": True,
  "requireScreenShare": True,
  "requireMobileProctor": True,
  "negativeMarking": True,
  "negativeMarkingFraction": 0.25,
  "shuffleQuestions": False,
  "shuffleOptions": False,
  "allowedLateJoinMinutes": 180,
  "autoSubmitOnViolations": True,
  "maxWarnings": 3,
  "dataRetentionDays": 90
})

cursor.execute("""
  UPDATE exams 
  SET startTime = ?, endTime = ?, isPublished = 1, policyConfig = ?
""", (start_time, end_time, policy_config))

# Check if demo exam already exists
demo_exam_id = '00000000-0000-0000-0000-000000000099'
cursor.execute('SELECT id FROM exams WHERE id = ?', (demo_exam_id,))
existing = cursor.fetchone()

if not existing:
    print('Inserting dedicated Live Demo Exam...')
    cursor.execute("""
        INSERT INTO exams (id, title, description, type, startTime, endTime, durationMinutes, totalMarks, passMarks, policyConfig, isPublished, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        demo_exam_id,
        '🔴 LIVE DEMO: Full AI Proctoring & External Camera Assessment',
        'Comprehensive demo assessment testing AI proctoring, webcam tracking, audio analysis, screen sharing, and mobile proctor pairing.',
        'mcq',
        start_time,
        end_time,
        60,
        100,
        40,
        policy_config,
        1,
        'cca25533-683c-4318-beb2-372a383e0a51',
        now,
        now
    ))

    students = [
        'dfbce5e7-08a6-49f2-aa7c-dea5d06e97f2', # student1
        '058151a6-4018-4ab8-9057-b56ac7a27942', # student2
        '98ae7d91-4cd6-45ae-9aff-e849f523fb46'  # student3
    ]

    for idx, student_id in enumerate(students):
        cursor.execute("""
            INSERT OR IGNORE INTO enrollments (id, examId, studentId, createdAt)
            VALUES (?, ?, ?, ?)
        """, (f'demo-enroll-{idx}', demo_exam_id, student_id, now))

    questions = [
        {
            'id': 'demo-q-1',
            'examId': demo_exam_id,
            'type': 'mcq',
            'marks': 25,
            'order': 1,
            'payload': json.dumps({
                'type': 'mcq',
                'text': 'In an AI proctored examination, which of the following signals triggers an immediate HIGH RISK violation alert?',
                'options': [
                    {'id': 'a', 'text': 'Multiple faces detected in the webcam frame simultaneously'},
                    {'id': 'b', 'text': 'Looking directly at the screen and answering questions'},
                    {'id': 'c', 'text': 'Typing code inside the embedded coding editor'},
                    {'id': 'd', 'text': 'Using the built-in question navigation buttons'}
                ],
                'correctOptionId': 'a'
            })
        },
        {
            'id': 'demo-q-2',
            'examId': demo_exam_id,
            'type': 'mcq',
            'marks': 25,
            'order': 2,
            'payload': json.dumps({
                'type': 'mcq',
                'text': 'What is the primary purpose of pairing a secondary mobile proctoring device during high-security online assessments?',
                'options': [
                    {'id': 'a', 'text': 'To provide a 360-degree secondary environmental and workspace monitoring angle'},
                    {'id': 'b', 'text': 'To allow the student to browse external answers on their mobile device'},
                    {'id': 'c', 'text': 'To replace the primary computer CPU processing power'},
                    {'id': 'd', 'text': 'To act as a remote control for navigating exam questions'}
                ],
                'correctOptionId': 'a'
            })
        },
        {
            'id': 'demo-q-3',
            'examId': demo_exam_id,
            'type': 'mcq',
            'marks': 25,
            'order': 3,
            'payload': json.dumps({
                'type': 'mcq',
                'text': 'When the AI proctor detects unexpected background speech or whispers via the microphone, what classification is logged in the Audit Trail?',
                'options': [
                    {'id': 'a', 'text': 'AUDIO_ANOMALY (Background voice detected)'},
                    {'id': 'b', 'text': 'NORMAL_OPERATION'},
                    {'id': 'c', 'text': 'NETWORK_TIMEOUT'},
                    {'id': 'd', 'text': 'SCREEN_RESOLUTION_CHANGE'}
                ],
                'correctOptionId': 'a'
            })
        },
        {
            'id': 'demo-q-4',
            'examId': demo_exam_id,
            'type': 'mcq',
            'marks': 25,
            'order': 4,
            'payload': json.dumps({
                'type': 'mcq',
                'text': 'If a student navigates away from the exam browser window or switches tabs during an active session, what event is fired?',
                'options': [
                    {'id': 'a', 'text': 'FOCUS_LOSS warning and logged violation'},
                    {'id': 'b', 'text': 'Automatic extra bonus marks added'},
                    {'id': 'c', 'text': 'System shutdown'},
                    {'id': 'd', 'text': 'No action taken'}
                ],
                'correctOptionId': 'a'
            })
        }
    ]

    for q in questions:
        cursor.execute("""
            INSERT INTO questions (id, examId, type, payload, marks, negativeMarks, sectionName, "order", createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 0, 'General Section', ?, ?, ?)
        """, (q['id'], q['examId'], q['type'], q['payload'], q['marks'], q['order'], now, now))
    print('Demo exam inserted successfully!')

conn.commit()
conn.close()
print('All exams updated and live!')
