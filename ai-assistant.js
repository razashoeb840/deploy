// MediPulse AI Medical Assistant Frontend Component
// Dynamic injection of floating assistant panel, speech-to-text, and appointment booking

(function () {
    // Inject FontAwesome and custom google font if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        document.head.appendChild(fa);
    }

    // Injected HTML template for floating widget
    const widgetHTML = `
    <!-- Floating Button -->
    <div id="ai-assistant-btn" class="ai-float-btn" onclick="toggleAIChat()">
        <i class="fas fa-heartbeat"></i>
        <span class="ai-btn-pulse"></span>
        <span class="tooltip-text">AI Medical Assistant</span>
    </div>

    <!-- AI Chat Window -->
    <div id="ai-chat-window" class="ai-chat-window">
        <div class="ai-chat-header">
            <div class="ai-header-logo">
                <i class="fas fa-robot"></i>
                <div>
                    <h4>MediPulse AI</h4>
                    <span class="status-online">Online symptom triage</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="ai-settings-toggle" onclick="toggleAISettings(event)" title="AI Settings" style="cursor: pointer; opacity: 0.8; font-size: 16px; display: flex; align-items: center;">
                    <i class="fas fa-cog"></i>
                </div>
                <button class="ai-close-btn" onclick="toggleAIChat()">&times;</button>
            </div>
        </div>

        <!-- Settings Panel -->
        <div class="ai-settings-panel" id="ai-settings-panel" style="background: #f8fafc; font-size: 12px; color: #334155;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-weight: 700; color: #1e293b;">Triage Language:</span>
                <select id="ai-lang-select" onchange="changeAILanguage(this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 11px; outline: none; background: white; cursor: pointer;">
                    <option value="en-US">English</option>
                    <option value="hi-IN">Hindi / Hinglish (हिंदी)</option>
                </select>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 700; color: #1e293b;">Auto-Read Responses (TTS):</span>
                <label class="ai-switch" style="position: relative; display: inline-block; width: 34px; height: 20px;">
                    <input type="checkbox" id="ai-tts-toggle" onchange="toggleAutoTTS(this.checked)" style="opacity: 0; width: 0; height: 0;">
                    <span class="ai-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 20px;"></span>
                </label>
            </div>
        </div>

        <div class="ai-chat-messages" id="ai-chat-messages">
            <!-- Messages will be dynamically rendered here -->
            <div class="ai-message bot">
                Hello! I am your **MediPulse AI Medical Assistant**. <br><br>
                Please describe your symptoms by:
                <ul>
                    <li>Type symptoms in chat</li>
                    <li>Click the 🎤 microphone to speak your symptoms directly (auto-sends when done)</li>
                    <li>Click the 📷 camera icon to upload an image of a rash/injury</li>
                </ul>
                I will analyze the symptoms, match you with the best doctor, and guide you to book an OPD appointment immediately.
            </div>
        </div>

        <!-- Image Preview Area -->
        <div id="ai-image-preview-bar" class="ai-image-preview-bar" style="display:none;">
            <div class="preview-container">
                <img id="ai-preview-img" src="" alt="Symptom Preview" />
                <button class="remove-preview" onclick="clearImagePreview()">&times;</button>
            </div>
        </div>

        <!-- Chat Input Bar -->
        <div class="ai-chat-input-container" id="ai-input-bar">
            <input type="file" id="ai-file-input" accept="image/*" style="display:none;" onchange="handleImageSelection(event)">
            <button class="ai-action-btn" onclick="triggerImageUpload()" title="Upload symptom photo">
                <i class="fas fa-camera"></i>
            </button>
            <button class="ai-action-btn voice-btn" id="ai-voice-btn" onclick="toggleVoiceRecording()" title="Speak symptoms">
                <i class="fas fa-microphone"></i>
                <div class="sound-wave" id="ai-sound-wave" style="display:none;">
                    <span></span><span></span><span></span>
                </div>
            </button>
            <input type="text" id="ai-text-input" placeholder="Type symptoms in English / Hinglish..." onkeypress="handleKeyPress(event)">
            <button class="ai-send-btn" onclick="sendPatientMessage()">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>

        <!-- Booking Form Area (Hidden by Default) -->
        <div class="ai-booking-panel" id="ai-booking-form" style="display:none;">
            <h5>Confirm Appointment Details</h5>
            <div class="booking-form-group">
                <label>Full Name</label>
                <input type="text" id="bk-name" placeholder="Enter full name">
            </div>
            <div class="booking-form-group">
                <label>Age</label>
                <input type="number" id="bk-age" placeholder="Age in years">
            </div>
            <div class="booking-form-group">
                <label>Contact Number</label>
                <input type="text" id="bk-contact" placeholder="10-digit mobile number">
            </div>
            <div class="booking-action-buttons">
                <button class="btn-cancel-bk" onclick="cancelBooking()">Cancel</button>
                <button class="btn-confirm-bk" onclick="proceedToPayment()">Pay & Book Appointment</button>
            </div>
        </div>
    </div>

    <!-- Dummy Payment Modal Container -->
    <div class="ai-payment-modal-overlay" id="ai-payment-modal" style="display:none;">
        <div class="ai-payment-modal">
            <h4>Verify OPD Consultation Fee</h4>
            <div class="pay-amount-box">
                <span class="pay-lbl">Total Payable</span>
                <span class="pay-val" id="pay-amount-val">₹ 500</span>
            </div>
            <div class="pay-details">
                <p><strong>Doctor:</strong> <span id="pay-doc-name">-</span></p>
                <p><strong>Cabin:</strong> <span id="pay-doc-cabin">-</span></p>
            </div>
            <div class="pay-methods">
                <div class="pay-opt active"><i class="fas fa-mobile-alt"></i> UPI Scan</div>
                <div class="pay-opt"><i class="far fa-credit-card"></i> Card</div>
            </div>
            <div style="font-size: 11px; color: #94a3b8; text-align: center; margin-bottom: 20px;">*This is a secure simulation payment step.</div>
            <button class="btn-pay-submit" id="btn-pay-submit" onclick="submitBookingRegistration()">Complete Payment (₹ 500)</button>
            <button class="btn-pay-cancel" onclick="closePaymentModal()">Cancel</button>
        </div>
    </div>
    `;

    // Inject into body when document is ready
    function injectWidget() {
        const div = document.createElement('div');
        div.innerHTML = widgetHTML;
        document.body.appendChild(div);
        initializeSettingsUI();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectWidget);
    } else {
        injectWidget();
    }

    // State Variables
    let currentImageBase64 = null;
    let currentImageType = null;
    let selectedDoctorId = null;
    let selectedDoctorDetails = null;
    let patientSymptoms = '';
    let problemKeyword = 'Consultation via AI Triage';
    let currentlySpeakingBtn = null;
    let speechRecognition = null;
    let isRecording = false;
    let activeAILanguage = localStorage.getItem('medipulse_ai_lang') || 'en-US';
    let isAutoTTSEnabled = localStorage.getItem('medipulse_ai_tts') === 'true';

    // Synchronize UI settings controls on start
    function initializeSettingsUI() {
        const langSelect = document.getElementById('ai-lang-select');
        const ttsToggle = document.getElementById('ai-tts-toggle');
        if (langSelect) langSelect.value = activeAILanguage;
        if (ttsToggle) ttsToggle.checked = isAutoTTSEnabled;

        const textInput = document.getElementById('ai-text-input');
        if (textInput) {
            textInput.placeholder = activeAILanguage === 'hi-IN' ? "Aapke symptoms batayein..." : "Type symptoms in English / Hinglish...";
        }
    }

    // Settings Panel Event Handlers
    window.toggleAISettings = function (e) {
        if (e) e.stopPropagation();
        const panel = document.getElementById('ai-settings-panel');
        if (panel) {
            panel.classList.toggle('active');
        }
    };

    window.changeAILanguage = function (val) {
        activeAILanguage = val;
        localStorage.setItem('medipulse_ai_lang', val);
        const textInput = document.getElementById('ai-text-input');
        if (textInput) {
            textInput.placeholder = val === 'hi-IN' ? "Aapke symptoms batayein..." : "Type symptoms in English / Hinglish...";
        }
    };

    window.toggleAutoTTS = function (checked) {
        isAutoTTSEnabled = checked;
        localStorage.setItem('medipulse_ai_tts', checked);
        if (!checked) {
            window.speechSynthesis.cancel();
        }
    };

    // Toggle Chat Window Visibility
    window.toggleAIChat = function () {
        const chat = document.getElementById('ai-chat-window');
        chat.classList.toggle('active');
        // Scroll to bottom
        const msgContainer = document.getElementById('ai-chat-messages');
        msgContainer.scrollTop = msgContainer.scrollHeight;
    };

    // Trigger Hidden Input File selector
    window.triggerImageUpload = function () {
        document.getElementById('ai-file-input').click();
    };

    // Handle Image Selection and generate thumbnail preview
    window.handleImageSelection = function (event) {
        const file = event.target.files[0];
        if (!file) return;

        currentImageType = file.type;
        const reader = new FileReader();
        reader.onload = function (e) {
            const result = e.target.result;
            // Display Preview
            document.getElementById('ai-preview-img').src = result;
            document.getElementById('ai-image-preview-bar').style.display = 'block';

            // Extract raw base64 string
            currentImageBase64 = result.split(',')[1];
        };
        reader.readAsDataURL(file);
    };

    // Clear Image Previews
    window.clearImagePreview = function () {
        currentImageBase64 = null;
        currentImageType = null;
        document.getElementById('ai-file-input').value = '';
        document.getElementById('ai-image-preview-bar').style.display = 'none';
        document.getElementById('ai-preview-img').src = '';
    };

    // Handle voice transcriptions
    window.toggleVoiceRecording = function () {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition is not supported in this browser. Please use text input.");
            return;
        }

        const btn = document.getElementById('ai-voice-btn');
        const wave = document.getElementById('ai-sound-wave');
        const micIcon = btn.querySelector('i');
        const inputField = document.getElementById('ai-text-input');

        if (!isRecording) {
            // Start recording
            speechRecognition = new SpeechRecognition();
            speechRecognition.continuous = false;
            speechRecognition.interimResults = false;
            speechRecognition.lang = activeAILanguage;

            speechRecognition.onstart = function () {
                isRecording = true;
                micIcon.style.display = 'none';
                wave.style.display = 'flex';
                inputField.placeholder = activeAILanguage === 'hi-IN' ? "Boliyen... (Listening)" : "Listening...";
                inputField.disabled = true;
            };

            speechRecognition.onerror = function (event) {
                console.error("Speech recognition error:", event.error);
                stopRecordingState();
            };

            speechRecognition.onend = function () {
                stopRecordingState();
            };

            speechRecognition.onresult = function (event) {
                const transcript = event.results[0][0].transcript;
                inputField.value = transcript;
                stopRecordingState();
                sendPatientMessage(); // Automatically submit query
            };

            speechRecognition.start();
        } else {
            // Stop recording
            if (speechRecognition) {
                speechRecognition.stop();
            }
            stopRecordingState();
        }
    };

    function stopRecordingState() {
        isRecording = false;
        const btn = document.getElementById('ai-voice-btn');
        const wave = document.getElementById('ai-sound-wave');
        const micIcon = btn.querySelector('i');
        const inputField = document.getElementById('ai-text-input');

        micIcon.style.display = 'inline-block';
        wave.style.display = 'none';
        inputField.placeholder = activeAILanguage === 'hi-IN' ? "Aapke symptoms batayein..." : "Type symptoms in English / Hinglish...";
        inputField.disabled = false;
        inputField.focus();
    }

    // Input trigger on Enter
    window.handleKeyPress = function (event) {
        if (event.key === 'Enter') {
            sendPatientMessage();
        }
    };

    // Send message to assistant
    window.sendPatientMessage = async function () {
        const input = document.getElementById('ai-text-input');
        const symptomsText = input.value.trim();

        if (symptomsText === '' && !currentImageBase64) {
            return;
        }

        // Add user message bubble
        const messagesContainer = document.getElementById('ai-chat-messages');
        const userMsgDiv = document.createElement('div');
        userMsgDiv.className = 'ai-message user';
        
        let bubbleContent = '';
        if (symptomsText) {
            bubbleContent += `<div>${symptomsText}</div>`;
            patientSymptoms = symptomsText; // save for registration problem
        }
        if (currentImageBase64) {
            bubbleContent += `<img src="data:${currentImageType};base64,${currentImageBase64}" class="chat-symptom-thumbnail" />`;
        }
        userMsgDiv.innerHTML = bubbleContent;
        messagesContainer.appendChild(userMsgDiv);

        // Clear input
        input.value = '';
        const savedImageBase64 = currentImageBase64;
        const savedImageType = currentImageType;
        clearImagePreview();

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message bot typing';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
            Analyzing symptoms using Gemini...
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Fetch AI Analysis from server
        try {
            const response = await fetch('/api/ai/analyze-symptoms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    textSymptoms: symptomsText,
                    imageBase64: savedImageBase64,
                    imageType: savedImageType,
                    language: activeAILanguage
                })
            });

            // Remove typing indicator
            typingDiv.remove();

            if (!response.ok) {
                const errData = await response.json();
                renderErrorMessage(errData.error || 'Server error during analysis.');
                return;
            }

            const aiResult = await response.json();
            renderAIRecommendation(aiResult);

        } catch (error) {
            console.error("AI fetch error:", error);
            typingDiv.remove();
            renderErrorMessage("Could not connect to medical assistant server.");
        }
    };

    // Error rendering in chat
    function renderErrorMessage(msg) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-message bot error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-circle" style="color:#ef4444; margin-right:6px;"></i>
            ${msg}
        `;
        messagesContainer.appendChild(errorDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Text-to-Speech (TTS) Reader
    window.speakText = function (text, lang, onStart, onEnd) {
        if (!('speechSynthesis' in window)) {
            console.error("Text-to-speech not supported in this browser.");
            return;
        }

        // Cancel any active speaking
        window.speechSynthesis.cancel();

        // Strip HTML tags from text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = text.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?[^>]+(>|$)/g, "");
        const cleanText = tempDiv.textContent || tempDiv.innerText || "";

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        // Find best local voice match
        const voices = window.speechSynthesis.getVoices();
        let targetVoice = null;

        if (lang === 'hi-IN') {
            // Find a Hindi voice or standard Indian English voice for Hinglish
            targetVoice = voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.lang.startsWith('en-IN'));
            utterance.lang = 'hi-IN';
        } else {
            // Find Indian English first, then generic English
            targetVoice = voices.find(v => v.lang.startsWith('en-IN')) || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
            utterance.lang = 'en-US';
        }

        if (targetVoice) {
            utterance.voice = targetVoice;
        }

        utterance.onstart = onStart;
        utterance.onend = onEnd;
        utterance.onerror = onEnd; // stop animation on error too

        window.speechSynthesis.speak(utterance);
    };

    window.readBotTriageResponse = function (btn) {
        if (currentlySpeakingBtn === btn && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            stopSpeakingState();
            return;
        }

        // Cancel other active speaking animations first
        stopSpeakingState();

        const bubble = btn.closest('.ai-message.bot');
        if (!bubble) return;

        const dept = bubble.querySelector('.triage-section:nth-of-type(1) .triage-val')?.innerText || '';
        const docName = bubble.querySelector('.ai-doc-name')?.innerText || '';
        const urgency = bubble.querySelector('.ai-urgency-badge')?.innerText || '';
        
        let firstAidItems = [];
        bubble.querySelectorAll('.first-aid-list li').forEach(li => firstAidItems.push(li.innerText));
        const firstAidText = firstAidItems.join('. ');

        const disclaimer = bubble.querySelector('.triage-disclaimer')?.innerText || '';

        // Formulate spoken script
        let speakScript = '';
        if (activeAILanguage === 'hi-IN') {
            speakScript = `AI Symptom Analysis. Triage Urgency level is ${urgency}. Recommended department is ${dept}. `;
            if (docName) {
                speakScript += `Recommended Doctor is ${docName}. `;
            }
            if (firstAidText) {
                speakScript += `General First-Aid guidance: ${firstAidText}. `;
            }
            if (disclaimer) {
                speakScript += disclaimer;
            }
        } else {
            speakScript = `AI symptom analysis. Urgency level is ${urgency}. Recommended department is ${dept}. `;
            if (docName) {
                speakScript += `Recommended doctor is ${docName}. `;
            }
            if (firstAidText) {
                speakScript += `General first-aid guidance: ${firstAidText}. `;
            }
            if (disclaimer) {
                speakScript += disclaimer;
            }
        }

        currentlySpeakingBtn = btn;

        window.speakText(
            speakScript, 
            activeAILanguage, 
            () => {
                btn.classList.add('speaking');
                btn.querySelector('i').className = 'fas fa-volume-mute';
                btn.title = "Stop listening";
            }, 
            () => {
                stopSpeakingState();
            }
        );
    };

    function stopSpeakingState() {
        if (currentlySpeakingBtn) {
            currentlySpeakingBtn.classList.remove('speaking');
            currentlySpeakingBtn.querySelector('i').className = 'fas fa-volume-up';
            currentlySpeakingBtn.title = "Listen to AI analysis";
            currentlySpeakingBtn = null;
        }
    }

    // Render Gemini triaged recommendation in chat
    async function renderAIRecommendation(result) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const botDiv = document.createElement('div');
        botDiv.className = 'ai-message bot';

        // Store the returned concise symptom keyword for queue registrations
        problemKeyword = result.problemKeyword || 'Consultation via AI Triage';
        selectedDoctorId = result.recommendedDoctorId;

        // Get details of matched doctor dynamically from API
        let docCardHtml = '';
        try {
            const docRes = await fetch('/api/doctors');
            const doctorsList = await docRes.json();
            const recommendedDoc = doctorsList.find(d => d._id === selectedDoctorId);

            if (recommendedDoc) {
                selectedDoctorDetails = recommendedDoc;
                docCardHtml = `
                    <div class="ai-doc-card">
                        <div class="ai-doc-header">
                            <div class="ai-doc-avatar">${recommendedDoc.name.replace('Dr. ', '').substring(0,2).toUpperCase()}</div>
                            <div>
                                <h6 class="ai-doc-name">${recommendedDoc.name}</h6>
                                <span class="ai-doc-spec">${recommendedDoc.specialization}</span>
                            </div>
                        </div>
                        <div class="ai-doc-body">
                            <p><strong>Cabin:</strong> ${recommendedDoc.cabin || 'General Ward'}</p>
                            <p><strong>Fee:</strong> ₹ ${recommendedDoc.fee || 500}</p>
                            <p class="ai-doc-about">"${recommendedDoc.about || 'Dedicated to providing excellent patient care.'}"</p>
                        </div>
                        <button class="ai-btn-book" onclick="showBookingForm()">
                            <i class="far fa-calendar-check"></i> Book OPD Token
                        </button>
                    </div>
                `;
            }
        } catch(e) {
            console.error("Error loading doctor details", e);
        }

        // Get urgency styling
        let urgencyClass = 'urgency-low';
        if (result.urgency === 'Medium') urgencyClass = 'urgency-med';
        if (result.urgency === 'High') urgencyClass = 'urgency-high';
        if (result.urgency === 'Critical') urgencyClass = 'urgency-critical';

        let firstAidHtml = '';
        if (result.firstAid) {
            let bullets = [];
            if (Array.isArray(result.firstAid)) {
                bullets = result.firstAid;
            } else if (typeof result.firstAid === 'string') {
                bullets = result.firstAid.split('\n').filter(line => line.trim() !== '');
            }
            firstAidHtml = `<ul class="first-aid-list">${bullets.map(b => `<li>${b.replace(/^-\s*/, '')}</li>`).join('')}</ul>`;
        }

        botDiv.innerHTML = `
            <div class="triage-header">
                <strong>AI Symptom Analysis</strong>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="ai-tts-btn" onclick="readBotTriageResponse(this)" title="Listen to AI analysis" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 14px; transition: 0.2s; display: flex; align-items: center; justify-content: center; padding: 0;">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <span class="ai-urgency-badge ${urgencyClass}">${result.urgency.toUpperCase()} URGENCY</span>
                </div>
            </div>
            
            <div class="triage-section">
                <div class="triage-lbl"><i class="fas fa-stethoscope"></i> Recommended Department</div>
                <div class="triage-val">${result.specialization}</div>
            </div>

            <div class="triage-section">
                <div class="triage-lbl"><i class="fas fa-first-aid"></i> General First-Aid Guidance</div>
                ${firstAidHtml}
            </div>

            <div class="triage-disclaimer">
                <strong>Disclaimer:</strong> ${result.disclaimer || 'First-aid suggestions are for temporary support and are not a substitute for professional diagnosis.'}
            </div>

            ${docCardHtml}
        `;

        messagesContainer.appendChild(botDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Auto read if enabled
        if (isAutoTTSEnabled) {
            const ttsBtn = botDiv.querySelector('.ai-tts-btn');
            if (ttsBtn) {
                // Short timeout to let the DOM settle and voices load
                setTimeout(() => {
                    window.readBotTriageResponse(ttsBtn);
                }, 400);
            }
        }
    }

    // Toggle Booking Form inside Chat panel
    window.showBookingForm = function () {
        if (!selectedDoctorDetails) return;
        document.getElementById('ai-input-bar').style.display = 'none';
        document.getElementById('ai-booking-form').style.display = 'block';

        // Auto focus
        document.getElementById('bk-name').focus();
    };

    window.cancelBooking = function () {
        document.getElementById('ai-booking-form').style.display = 'none';
        document.getElementById('ai-input-bar').style.display = 'flex';
    };

    // Open Simulator Payment Modal
    window.proceedToPayment = function () {
        const name = document.getElementById('bk-name').value.trim();
        const age = document.getElementById('bk-age').value.trim();
        const contact = document.getElementById('bk-contact').value.trim();

        if (!name || !age || !contact) {
            alert("Please fill in all details to proceed to booking.");
            return;
        }

        document.getElementById('pay-doc-name').textContent = selectedDoctorDetails.name;
        document.getElementById('pay-doc-cabin').textContent = selectedDoctorDetails.cabin || 'General Ward';
        document.getElementById('pay-amount-val').textContent = `₹ ${selectedDoctorDetails.fee || 500}`;
        document.getElementById('btn-pay-submit').textContent = `Complete Payment (₹ ${selectedDoctorDetails.fee || 500})`;

        document.getElementById('ai-payment-modal').style.display = 'flex';
    };

    window.closePaymentModal = function () {
        document.getElementById('ai-payment-modal').style.display = 'none';
    };

    // Complete Booking Registration in MongoDB
    window.submitBookingRegistration = async function () {
        const btn = document.getElementById('btn-pay-submit');
        btn.textContent = 'Processing Payment...';
        btn.disabled = true;

        const payload = {
            name: document.getElementById('bk-name').value.trim(),
            age: parseInt(document.getElementById('bk-age').value.trim(), 10),
            contact: document.getElementById('bk-contact').value.trim(),
            problem: problemKeyword,
            assignedDoctor: selectedDoctorId,
            address: 'Consultation via AI',
            aadhar: 'N/A'
        };

        try {
            const response = await fetch('/api/patients/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            closePaymentModal();
            cancelBooking();

            if (data.success) {
                renderBookingSuccessCard(data.patient);
            } else {
                renderErrorMessage(data.error || 'Failed to submit registration.');
            }

        } catch (e) {
            closePaymentModal();
            cancelBooking();
            renderErrorMessage("Network connection error. Could not book appointment.");
        }

        btn.disabled = false;
    };

    // Render real-time generated OPD token success card
    function renderBookingSuccessCard(patient) {
        const messagesContainer = document.getElementById('ai-chat-messages');
        const successDiv = document.createElement('div');
        successDiv.className = 'ai-message bot success-booking-card';

        successDiv.innerHTML = `
            <div style="font-size:32px; color:#10b981; margin-bottom:10px;"><i class="fas fa-check-circle"></i></div>
            <h5 style="color:#0f172a; margin-bottom:5px; font-weight:700;">Booking Confirmed!</h5>
            <p style="font-size:12px; color:#64748b; margin-bottom:15px;">Your OPD token has been generated. Please wait at the reception lobby.</p>
            <div class="ai-token-display">T-${patient.token}</div>
            <div style="font-size:11px; color:#10b981; font-weight:700; text-transform:uppercase; margin-top:10px;"><i class="fas fa-shield-alt"></i> Paid Verified</div>
        `;

        messagesContainer.appendChild(successDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

})();
