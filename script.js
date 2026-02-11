// Login System Variables
const loginContainer = document.getElementById('loginContainer');
const mainContent = document.getElementById('mainContent');
const loginTabs = document.querySelectorAll('.login-tab');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');
const logoutBtn = document.getElementById('logoutBtn');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userGender = document.getElementById('userGender');

// Forms
const patientLoginForm = document.getElementById('patientLoginForm');
const patientRegisterForm = document.getElementById('patientRegisterForm');
const doctorLoginForm = document.getElementById('doctorLoginForm');
const doctorRegisterForm = document.getElementById('doctorRegisterForm');

// Links for switching between login/register
const showPatientRegister = document.getElementById('showPatientRegister');
const showPatientLogin = document.getElementById('showPatientLogin');
const showDoctorRegister = document.getElementById('showDoctorRegister');
const showDoctorLogin = document.getElementById('showDoctorLogin');

// Storage for users
let usersDB = {
    patients: JSON.parse(localStorage.getItem('telehealth_patients')) || [
        { id: 1, email: 'demo@patient.com', password: 'demo123', name: 'John Patient', avatar: 'JP', age: 35, gender: 'Male' }
    ],
    doctors: JSON.parse(localStorage.getItem('telehealth_doctors')) || [
        { id: 1, email: 'drjennifer@telehealth.com', password: 'doctor123', name: 'Dr. Jennifer Davis', avatar: 'JD', specialty: 'Psychiatry', license: 'MD12345', gender: 'Female' }
    ]
};

// Current user state
let currentUser = null;
let userType = null;

// DOM Elements
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');
const dashboardTabs = document.querySelectorAll('.dashboard-tab');
const dashboardContents = document.querySelectorAll('.dashboard-content');
const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const videoOverlay = document.getElementById('videoOverlay');
const videoStatus = document.getElementById('videoStatus');
const startVideoBtn = document.getElementById('startVideo');
const stopVideoBtn = document.getElementById('stopVideo');
const analyzeEmotionBtn = document.getElementById('analyzeEmotion');
const doctorCards = document.querySelectorAll('.doctor-card');
const scheduleConsultationBtn = document.getElementById('scheduleConsultation');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const analyzeSpeechBtn = document.getElementById('analyzeSpeech');
const startConsultationBtn = document.getElementById('startConsultation');
const endConsultationBtn = document.getElementById('endConsultation');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');
const chatMessages = document.getElementById('chatMessages');

// State variables
let stream = null;
let isVideoActive = false;
let isRecording = false;
let isConsultationActive = false;
let emotionInterval = null;
let speechInterval = null;

// Chatbot responses based on symptoms
const chatbotResponses = {
    'headache': {
        questions: [
            "How long have you had this headache?",
            "Is the pain throbbing or constant?",
            "On a scale of 1-10, how severe is the pain?",
            "Have you taken any medication for it?"
        ],
        suggestions: [
            "Try resting in a quiet, dark room",
            "Apply a cold compress to your forehead",
            "Stay hydrated and avoid caffeine",
            "Consider over-the-counter pain relief if suitable"
        ],
        urgency: 3
    },
    'fever': {
        questions: [
            "What is your current temperature?",
            "How long have you had the fever?",
            "Do you have any other symptoms?",
            "Have you taken your temperature recently?"
        ],
        suggestions: [
            "Rest and stay hydrated",
            "Take fever-reducing medication if appropriate",
            "Use a cool compress",
            "Monitor temperature every 4 hours"
        ],
        urgency: 4
    },
    'cough': {
        questions: [
            "Is your cough dry or productive?",
            "How long have you had the cough?",
            "Does it worsen at night?",
            "Any shortness of breath?"
        ],
        suggestions: [
            "Stay hydrated with warm liquids",
            "Use a humidifier",
            "Avoid irritants like smoke",
            "Consider cough suppressants if suitable"
        ],
        urgency: 2
    },
    'fatigue': {
        questions: [
            "How long have you felt fatigued?",
            "Are you sleeping well?",
            "Any changes in appetite?",
            "Do you feel weak or just tired?"
        ],
        suggestions: [
            "Ensure adequate sleep (7-9 hours)",
            "Maintain a balanced diet",
            "Practice gentle exercise",
            "Consider stress management techniques"
        ],
        urgency: 2
    },
    'pain': {
        questions: [
            "Where exactly is the pain located?",
            "On a scale of 1-10, how severe is it?",
            "What makes it better or worse?",
            "When did it start?"
        ],
        suggestions: [
            "Rest the affected area",
            "Apply ice for acute pain, heat for chronic",
            "Consider appropriate pain relief",
            "Avoid activities that worsen pain"
        ],
        urgency: 3
    },
    'anxiety': {
        questions: [
            "Can you describe what triggers your anxiety?",
            "How often do you experience these feelings?",
            "Any physical symptoms like palpitations?",
            "Are you able to sleep normally?"
        ],
        suggestions: [
            "Practice deep breathing exercises",
            "Try mindfulness meditation",
            "Limit caffeine intake",
            "Maintain a regular sleep schedule"
        ],
        urgency: 3
    }
};

// Emergency keywords
const emergencyKeywords = [
    'chest pain', 'difficulty breathing', 'severe bleeding', 
    'unconscious', 'stroke symptoms', 'suicidal thoughts',
    'severe allergic reaction', 'broken bone', 'severe burn'
];

// Login System Functions
function initLoginSystem() {
    // Tab switching
    loginTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabType = tab.getAttribute('data-tab');
            
            loginTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            hideAllForms();
            if (tabType === 'patient') {
                patientLoginForm.classList.add('active');
            } else {
                doctorLoginForm.classList.add('active');
            }
            
            clearMessages();
        });
    });

    // Form switching links
    showPatientRegister.addEventListener('click', () => {
        hideAllForms();
        patientRegisterForm.classList.add('active');
        clearMessages();
    });

    showPatientLogin.addEventListener('click', () => {
        hideAllForms();
        patientLoginForm.classList.add('active');
        clearMessages();
    });

    showDoctorRegister.addEventListener('click', () => {
        hideAllForms();
        doctorRegisterForm.classList.add('active');
        clearMessages();
    });

    showDoctorLogin.addEventListener('click', () => {
        hideAllForms();
        doctorLoginForm.classList.add('active');
        clearMessages();
    });

    // Patient Login
    patientLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('patientUsername').value.trim().toLowerCase();
        const password = document.getElementById('patientPassword').value;
        const gender = document.getElementById('patientLoginGender').value;
        
        if (!gender) {
            showError('Please select your gender');
            return;
        }
        
        const patient = usersDB.patients.find(p => p.email === email && p.password === password);
        
        if (patient) {
            // Update gender if different from stored (optional)
            if (patient.gender !== gender) {
                patient.gender = gender;
                localStorage.setItem('telehealth_patients', JSON.stringify(usersDB.patients));
            }
            
            currentUser = patient;
            userType = 'patient';
            loginSuccess(patient.name, patient.avatar, patient.gender);
        } else {
            showError('Invalid email or password');
        }
    });

    // Patient Registration
    patientRegisterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('patientRegName').value.trim();
        const email = document.getElementById('patientRegEmail').value.trim().toLowerCase();
        const password = document.getElementById('patientRegPassword').value;
        const confirmPassword = document.getElementById('patientRegConfirmPassword').value;
        const age = document.getElementById('patientRegAge').value;
        const gender = document.getElementById('patientRegGender').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (!gender) {
            showError('Please select gender');
            return;
        }
        
        if (usersDB.patients.some(p => p.email === email)) {
            showError('Email already registered');
            return;
        }
        
        const newPatient = {
            id: usersDB.patients.length + 1,
            email: email,
            password: password,
            name: name,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            age: parseInt(age),
            gender: gender
        };
        
        usersDB.patients.push(newPatient);
        localStorage.setItem('telehealth_patients', JSON.stringify(usersDB.patients));
        
        showSuccess('Account created successfully! Please login.');
        
        setTimeout(() => {
            hideAllForms();
            patientLoginForm.classList.add('active');
            document.getElementById('patientUsername').value = email;
            document.getElementById('patientPassword').value = '';
            document.getElementById('patientLoginGender').value = gender;
            clearMessages();
        }, 2000);
    });

    // Doctor Login
    doctorLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('doctorUsername').value.trim().toLowerCase();
        const password = document.getElementById('doctorPassword').value;
        const gender = document.getElementById('doctorLoginGender').value;
        
        if (!gender) {
            showError('Please select your gender');
            return;
        }
        
        const isEmail = username.includes('@');
        const doctor = usersDB.doctors.find(d => 
            (isEmail ? d.email === username : d.license === username) && 
            d.password === password
        );
        
        if (doctor) {
            // Update gender if different from stored (optional)
            if (doctor.gender !== gender) {
                doctor.gender = gender;
                localStorage.setItem('telehealth_doctors', JSON.stringify(usersDB.doctors));
            }
            
            currentUser = doctor;
            userType = 'doctor';
            loginSuccess(doctor.name, doctor.avatar, doctor.gender);
        } else {
            showError('Invalid credentials');
        }
    });

    // Doctor Registration
    doctorRegisterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('doctorRegName').value.trim();
        const email = document.getElementById('doctorRegEmail').value.trim().toLowerCase();
        const specialty = document.getElementById('doctorRegSpecialty').value;
        const license = document.getElementById('doctorRegLicense').value.trim();
        const password = document.getElementById('doctorRegPassword').value;
        const confirmPassword = document.getElementById('doctorRegConfirmPassword').value;
        const gender = document.getElementById('doctorRegGender').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (!gender) {
            showError('Please select gender');
            return;
        }
        
        if (usersDB.doctors.some(d => d.email === email)) {
            showError('Email already registered');
            return;
        }
        
        if (usersDB.doctors.some(d => d.license === license)) {
            showError('License number already registered');
            return;
        }
        
        const newDoctor = {
            id: usersDB.doctors.length + 1,
            email: email,
            password: password,
            name: name,
            avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            specialty: specialty,
            license: license,
            gender: gender
        };
        
        usersDB.doctors.push(newDoctor);
        localStorage.setItem('telehealth_doctors', JSON.stringify(usersDB.doctors));
        
        showSuccess('Doctor account created successfully! Please login.');
        
        setTimeout(() => {
            hideAllForms();
            doctorLoginForm.classList.add('active');
            document.getElementById('doctorUsername').value = email;
            document.getElementById('doctorPassword').value = '';
            document.getElementById('doctorLoginGender').value = gender;
            clearMessages();
        }, 2000);
    });

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Check if already logged in
    checkLoginStatus();
}

function hideAllForms() {
    const forms = document.querySelectorAll('.login-form, .register-form');
    forms.forEach(form => form.classList.remove('active'));
}

function clearMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

function showSuccess(message) {
    successText.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

function loginSuccess(name, avatar, gender) {
    userAvatar.textContent = avatar;
    userName.textContent = name;
    userGender.textContent = gender;
    
    loginContainer.classList.add('hidden');
    setTimeout(() => {
        mainContent.classList.add('show');
    }, 300);
    
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userType', userType);
    sessionStorage.setItem('userName', name);
    sessionStorage.setItem('userAvatar', avatar);
    sessionStorage.setItem('userGender', gender);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        loginContainer.classList.remove('hidden');
        mainContent.classList.remove('show');
        
        hideAllForms();
        patientLoginForm.classList.add('active');
        loginTabs.forEach(tab => tab.classList.remove('active'));
        loginTabs[0].classList.add('active');
        
        clearMessages();
        
        currentUser = null;
        userType = null;
    }
}

function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        const storedName = sessionStorage.getItem('userName');
        const storedAvatar = sessionStorage.getItem('userAvatar');
        const storedGender = sessionStorage.getItem('userGender');
        
        if (storedName && storedAvatar) {
            userAvatar.textContent = storedAvatar;
            userName.textContent = storedName;
            userGender.textContent = storedGender || 'Not specified';
            
            loginContainer.classList.add('hidden');
            mainContent.classList.add('show');
        }
    }
}

// Main Application Functions
async function startVideoStream() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 }
            } 
        });
        
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        videoOverlay.style.display = 'none';
        videoStatus.textContent = 'Camera active - AI analyzing';
        
        startVideoBtn.disabled = true;
        stopVideoBtn.disabled = false;
        isVideoActive = true;
        
        startEmotionDetection();
        
    } catch (err) {
        console.error('Error accessing camera:', err);
        videoStatus.textContent = 'Camera access denied. Using simulated data.';
        videoOverlay.innerHTML = '<i class="fas fa-user-circle" style="font-size: 3rem;"></i><p>Simulated camera feed</p>';
        
        startVideoBtn.disabled = true;
        stopVideoBtn.disabled = false;
        isVideoActive = true;
        startEmotionDetection();
    }
}

function stopVideoStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    videoElement.srcObject = null;
    videoElement.style.display = 'none';
    videoOverlay.style.display = 'flex';
    videoStatus.textContent = 'Camera stopped';
    
    startVideoBtn.disabled = false;
    stopVideoBtn.disabled = true;
    isVideoActive = false;
    
    if (emotionInterval) {
        clearInterval(emotionInterval);
        emotionInterval = null;
    }
}

function startEmotionDetection() {
    emotionInterval = setInterval(() => {
        const currentEmotions = {
            happiness: Math.max(0, Math.min(100, parseFloat(document.getElementById('happinessValue').textContent) + (Math.random() * 10 - 5))),
            neutral: Math.max(0, Math.min(100, parseFloat(document.getElementById('neutralValue').textContent) + (Math.random() * 6 - 3))),
            sadness: Math.max(0, Math.min(100, parseFloat(document.getElementById('sadnessValue').textContent) + (Math.random() * 4 - 2))),
            anger: Math.max(0, Math.min(100, parseFloat(document.getElementById('angerValue').textContent) + (Math.random() * 3 - 1.5))),
            fear: Math.random() * 5,
            surprise: Math.random() * 3
        };
        
        const total = Object.values(currentEmotions).reduce((a, b) => a + b, 0);
        Object.keys(currentEmotions).forEach(key => {
            currentEmotions[key] = (currentEmotions[key] / total * 100).toFixed(1);
        });
        
        updateEmotionDisplay(currentEmotions);
    }, 2000);
}

function updateEmotionDisplay(emotions) {
    Object.keys(emotions).forEach(emotion => {
        const valueElement = document.getElementById(`${emotion}Value`);
        const barElement = document.getElementById(`${emotion}Bar`);
        
        if (valueElement && barElement) {
            valueElement.textContent = `${emotions[emotion]}%`;
            barElement.style.width = `${emotions[emotion]}%`;
        }
    });
}

function analyzeEmotion() {
    if (!isVideoActive) {
        alert('Please start the camera first to analyze emotions.');
        return;
    }
    
    const emotions = {
        happiness: (Math.random() * 40 + 40).toFixed(1),
        neutral: (Math.random() * 30 + 20).toFixed(1),
        sadness: (Math.random() * 20 + 5).toFixed(1),
        anger: (Math.random() * 15 + 2).toFixed(1),
        fear: (Math.random() * 10).toFixed(1),
        surprise: (Math.random() * 8).toFixed(1)
    };
    
    updateEmotionDisplay(emotions);
    
    const primaryEmotion = Object.keys(emotions).reduce((a, b) => 
        emotions[a] > emotions[b] ? a : b
    );
    
    alert(`Emotion Analysis Complete!\n\nPrimary emotion: ${primaryEmotion}\nHappiness: ${emotions.happiness}%\nNeutral: ${emotions.neutral}%\nSadness: ${emotions.sadness}%\n\nRecommendation: Based on emotional state, a mental health consultation is recommended.`);
}

// Speech Functions
function startSpeechRecording() {
    if (!isRecording) {
        isRecording = true;
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        
        document.getElementById('speechTranscript').textContent = "Recording... Please describe your symptoms.";
        
        speechInterval = setInterval(() => {
            const stress = Math.floor(Math.random() * 10 + 35);
            const fatigue = Math.floor(Math.random() * 8 + 25);
            const emotional = Math.floor(Math.random() * 6 + 20);
            
            document.getElementById('stressValue').textContent = `${stress}%`;
            document.getElementById('stressBar').style.width = `${stress}%`;
            
            document.getElementById('fatigueValue').textContent = `${fatigue}%`;
            document.getElementById('fatigueBar').style.width = `${fatigue}%`;
            
            document.getElementById('emotionalValue').textContent = `${emotional}%`;
            document.getElementById('emotionalBar').style.width = `${emotional}%`;
        }, 1500);
    }
}

function stopSpeechRecording() {
    if (isRecording) {
        isRecording = false;
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        
        document.getElementById('speechTranscript').textContent = 
            "\"I've been having headaches for the past week, and I'm feeling more tired than usual. Sometimes I feel anxious about work deadlines.\"";
        
        if (speechInterval) {
            clearInterval(speechInterval);
            speechInterval = null;
        }
    }
}

function analyzeSpeechPatterns() {
    const analysis = {
        stress: Math.floor(Math.random() * 40) + 20,
        fatigue: Math.floor(Math.random() * 35) + 15,
        emotional: Math.floor(Math.random() * 30) + 20,
        keywords: ['headache', 'tired', 'stress', 'anxious', 'fatigue']
    };
    
    document.getElementById('stressValue').textContent = `${analysis.stress}%`;
    document.getElementById('stressBar').style.width = `${analysis.stress}%`;
    
    document.getElementById('fatigueValue').textContent = `${analysis.fatigue}%`;
    document.getElementById('fatigueBar').style.width = `${analysis.fatigue}%`;
    
    document.getElementById('emotionalValue').textContent = `${analysis.emotional}%`;
    document.getElementById('emotionalBar').style.width = `${analysis.emotional}%`;
    
    alert(`Speech Analysis Complete!\n\nStress Level: ${analysis.stress}%\nFatigue Detection: ${analysis.fatigue}%\nEmotional Distress: ${analysis.emotional}%\n\nDetected Keywords: ${analysis.keywords.join(', ')}\n\nRecommendation: Stress management specialist consultation.`);
}

// Consultation Functions
function startConsultation() {
    if (!isConsultationActive) {
        isConsultationActive = true;
        startConsultationBtn.disabled = true;
        endConsultationBtn.disabled = false;
        
        addChatMessage('Dr. Jennifer Davis', 'Hello! The consultation has started. How can I help you today?', 'doctor');
        
        alert('Consultation started! AI monitoring is active.');
    }
}

function endConsultation() {
    if (isConsultationActive) {
        isConsultationActive = false;
        startConsultationBtn.disabled = false;
        endConsultationBtn.disabled = true;
        
        addChatMessage('Dr. Jennifer Davis', 'Consultation ended. A summary will be sent to your email. Take care!', 'doctor');
        
        alert('Consultation ended. Summary sent to your email.');
    }
}

// Enhanced Chatbot Functions
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && isConsultationActive) {
        addChatMessage('You', message, 'patient');
        chatInput.value = '';
        
        const analysis = analyzePatientMessage(message);
        showChatSuggestions(analysis.keywords);
        
        if (analysis.isEmergency) {
            showEmergencyAlert(message);
        }
        
        setTimeout(() => {
            const response = generateDoctorResponse(analysis);
            addChatMessage('Dr. Jennifer Davis', response.message, 'doctor');
            
            if (response.diagnosis) {
                showDiagnosisResult(response.diagnosis);
            }
        }, 1000);
    } else if (message) {
        alert('Please start the consultation first.');
    }
}

function analyzePatientMessage(message) {
    const lowerMessage = message.toLowerCase();
    const analysis = {
        keywords: [],
        symptoms: [],
        severity: 1,
        isEmergency: false,
        possibleConditions: []
    };
    
    emergencyKeywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
            analysis.isEmergency = true;
            analysis.severity = 5;
        }
    });
    
    for (const [symptom, data] of Object.entries(chatbotResponses)) {
        if (lowerMessage.includes(symptom)) {
            analysis.keywords.push(symptom);
            analysis.symptoms.push({
                symptom: symptom,
                urgency: data.urgency
            });
            
            if (data.urgency > analysis.severity) {
                analysis.severity = data.urgency;
            }
        }
    }
    
    const severityWords = ['severe', 'extreme', 'terrible', 'awful', 'unbearable'];
    severityWords.forEach(word => {
        if (lowerMessage.includes(word)) {
            analysis.severity = Math.max(analysis.severity, 4);
        }
    });
    
    analysis.possibleConditions = determinePossibleConditions(analysis.symptoms);
    
    return analysis;
}

function determinePossibleConditions(symptoms) {
    const conditionMap = {
        'headache': ['Migraine', 'Tension Headache', 'Sinusitis', 'Cluster Headache'],
        'fever': ['Viral Infection', 'Bacterial Infection', 'Flu', 'COVID-19'],
        'cough': ['Common Cold', 'Bronchitis', 'Pneumonia', 'Allergies'],
        'fatigue': ['Anemia', 'Chronic Fatigue', 'Depression', 'Thyroid Issues'],
        'pain': ['Muscle Strain', 'Arthritis', 'Nerve Pain', 'Inflammation'],
        'anxiety': ['Generalized Anxiety', 'Panic Disorder', 'Stress Response']
    };
    
    const conditions = new Set();
    symptoms.forEach(symptom => {
        if (conditionMap[symptom.symptom]) {
            conditionMap[symptom.symptom].forEach(condition => {
                conditions.add(condition);
            });
        }
    });
    
    return Array.from(conditions);
}

function showChatSuggestions(keywords) {
    let suggestions = [];
    
    keywords.forEach(keyword => {
        if (chatbotResponses[keyword]) {
            suggestions = suggestions.concat(chatbotResponses[keyword].questions.slice(0, 2));
        }
    });
    
    if (suggestions.length === 0) {
        suggestions = [
            "How long have you had these symptoms?",
            "Can you describe the symptoms in more detail?",
            "Have you taken any medication?",
            "Is there anything that makes it better or worse?"
        ];
    }
    
    const existing = document.querySelector('.chat-suggestions');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'chat-suggestions';
    
    suggestions.forEach(suggestion => {
        const button = document.createElement('div');
        button.className = 'chat-suggestion';
        button.textContent = suggestion;
        button.addEventListener('click', () => {
            chatInput.value = suggestion;
            chatInput.focus();
        });
        container.appendChild(button);
    });
    
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateDoctorResponse(analysis) {
    let response = {
        message: "",
        diagnosis: null
    };
    
    if (analysis.isEmergency) {
        response.message = "⚠️ EMERGENCY DETECTED! Please call emergency services immediately. I've alerted the nearest hospital. Stay on the line for further instructions.";
        return response;
    }
    
    if (analysis.symptoms.length > 0) {
        const symptomList = analysis.symptoms.map(s => s.symptom).join(', ');
        response.message = `Thank you for describing your symptoms (${symptomList}). `;
        
        const primarySymptom = analysis.symptoms[0].symptom;
        if (chatbotResponses[primarySymptom]) {
            response.message += chatbotResponses[primarySymptom].questions[0] + " ";
        }
        
        response.message += "In the meantime, you might try: ";
        if (chatbotResponses[primarySymptom]) {
            response.message += chatbotResponses[primarySymptom].suggestions[0];
        }
        
        if (analysis.possibleConditions.length > 0) {
            response.diagnosis = {
                possibleConditions: analysis.possibleConditions,
                confidence: Math.min(80 + analysis.symptoms.length * 5, 95),
                recommendations: [
                    "Schedule a video consultation",
                    "Consider lab tests if symptoms persist",
                    "Monitor symptoms daily"
                ]
            };
        }
        
    } else {
        response.message = "Thank you for your message. Can you please describe your symptoms in more detail? This will help me provide better assistance.";
    }
    
    return response;
}

function showDiagnosisResult(diagnosis) {
    const existing = document.querySelector('.diagnosis-result');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'diagnosis-result';
    container.innerHTML = `
        <h4>🩺 Preliminary AI Diagnosis</h4>
        <p><strong>Possible conditions:</strong> ${diagnosis.possibleConditions.join(', ')}</p>
        <p><strong>Confidence:</strong> ${diagnosis.confidence}%</p>
        <p><strong>Recommendations:</strong></p>
        <ul>
            ${diagnosis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        <p><em>Note: This is an AI-generated preliminary diagnosis. Please consult with a healthcare professional for accurate diagnosis.</em></p>
    `;
    
    chatMessages.appendChild(container);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showEmergencyAlert(message) {
    const existing = document.querySelector('.emergency-alert');
    if (existing) existing.remove();
    
    const container = document.createElement('div');
    container.className = 'emergency-alert';
    container.innerHTML = `
        <h4>🚨 EMERGENCY ALERT</h4>
        <p>Emergency keywords detected in your message: "${message}"</p>
        <p>Please call emergency services immediately at <strong>911</strong> or your local emergency number.</p>
        <p>I've notified the on-call doctor and your emergency contact.</p>
    `;
    
    chatMessages.insertBefore(container, chatMessages.firstChild);
    
    alert("EMERGENCY DETECTED! Please seek immediate medical attention!");
}

function addChatMessage(sender, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize login system
    initLoginSystem();
    
    // Mobile menu
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                navLinks.classList.remove('active');
            }
        });
    });

    // Dashboard tabs
    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            dashboardTabs.forEach(t => t.classList.remove('active'));
            dashboardContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            if (tabId !== 'emotion' && isVideoActive) {
                stopVideoStream();
            }
        });
    });

    // Doctor card selection
    doctorCards.forEach(card => {
        card.addEventListener('click', () => {
            doctorCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    // Video controls
    startVideoBtn.addEventListener('click', startVideoStream);
    stopVideoBtn.addEventListener('click', stopVideoStream);
    analyzeEmotionBtn.addEventListener('click', analyzeEmotion);

    // Schedule consultation
    scheduleConsultationBtn.addEventListener('click', () => {
        const selectedDoctor = document.querySelector('.doctor-card.selected h4').textContent;
        alert(`Consultation scheduled with ${selectedDoctor}!\n\nDate: Tomorrow at 10:00 AM\nDuration: 30 minutes\nA confirmation email has been sent.`);
    });

    // Speech controls
    startRecordingBtn.addEventListener('click', startSpeechRecording);
    stopRecordingBtn.addEventListener('click', stopSpeechRecording);
    analyzeSpeechBtn.addEventListener('click', analyzeSpeechPatterns);

    // Consultation controls
    startConsultationBtn.addEventListener('click', startConsultation);
    endConsultationBtn.addEventListener('click', endConsultation);

    // Chat functionality
    sendMessageBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });

    // Initialize with random values for demo
    updateEmotionDisplay({
        happiness: 42,
        neutral: 10,
        sadness: 4,
        anger: 4,
        fear: 0,
        surprise: 0
    });
});