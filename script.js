
        // DOM elements
        const inputSection = document.getElementById('inputSection');
        const testSection = document.getElementById('testSection');
        const resultsSection = document.getElementById('resultsSection');
        const jsonInput = document.getElementById('jsonInput');
        const loadQuestionsBtn = document.getElementById('loadQuestionsBtn');
        const loadSampleBtn = document.getElementById('loadSampleBtn');
        const clearBtn = document.getElementById('clearBtn');
        const viewSampleBtn = document.getElementById('viewSampleBtn');
        const sampleJson = document.getElementById('sampleJson');
        const jsonProgress = document.getElementById('jsonProgress');

        // Test elements
        const currentQuestion = document.getElementById('currentQuestion');
        const totalQuestions = document.getElementById('totalQuestions');
        const questionNumber = document.getElementById('questionNumber');
        const questionText = document.getElementById('questionText');
        const optionsContainer = document.getElementById('optionsContainer');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitTestBtn = document.getElementById('submitTestBtn');
        const correctCount = document.getElementById('correctCount');
        const timer = document.getElementById('timer');

        // Results elements
        const correctAnswers = document.getElementById('correctAnswers');
        const wrongAnswers = document.getElementById('wrongAnswers');
        const resultPercentage = document.getElementById('resultPercentage');
        const scorePercentage = document.getElementById('scorePercentage');
        const scoreText = document.getElementById('scoreText');
        const reviewTestBtn = document.getElementById('reviewTestBtn');
        const newTestBtn = document.getElementById('newTestBtn');

        // Application state
        let questions = [];
        let currentQuestionIndex = 0;
        let userAnswers = [];
        let testStarted = false;
        let startTime = null;
        let timerInterval = null;

        // Sample questions for demonstration
        const sampleQuestions = [
            {
                question: "What is the primary responsibility of ASF?",
                options: ["Passenger facilitation", "Aviation security", "Customs enforcement", "Immigration control"],
                answer: "Aviation security"
            },
            {
                question: "What does ASI stand for in ASF?",
                options: ["Assistant Sub-Inspector", "Airport Security Inspector", "Aviation Security Inspector", "Assistant Security Inspector"],
                answer: "Assistant Sub-Inspector"
            },
            {
                question: "Which act governs the ASF in Pakistan?",
                options: ["Airport Security Act 1975", "ASF Act 1975", "Aviation Security Act 1975", "Airport Security Force Act 1975"],
                answer: "Airport Security Force Act 1975"
            },
            {
                question: "What is the rank structure of ASF?",
                options: ["Similar to Police", "Similar to Army", "Similar to Airport Authority", "Unique to ASF"],
                answer: "Similar to Police"
            },
            {
                question: "Which of the following is NOT a duty of ASF?",
                options: ["Screening of passengers", "Screening of baggage", "Immigration clearance", "Protection of aircraft"],
                answer: "Immigration clearance"
            },
            {
                question: "What is the minimum qualification required for ASI in ASF?",
                options: ["Matric", "Intermediate", "Bachelor's degree", "Master's degree"],
                answer: "Intermediate"
            },
            {
                question: "The ASF headquarters is located in?",
                options: ["Karachi", "Islamabad", "Lahore", "Rawalpindi"],
                answer: "Karachi"
            },
            {
                question: "When was ASF established?",
                options: ["1974", "1975", "1976", "1977"],
                answer: "1976"
            }
        ];

        // Event Listeners
        loadQuestionsBtn.addEventListener('click', loadQuestions);
        loadSampleBtn.addEventListener('click', loadSampleQuestions);
        clearBtn.addEventListener('click', clearInput);
        viewSampleBtn.addEventListener('click', toggleSampleJson);
        prevBtn.addEventListener('click', showPreviousQuestion);
        nextBtn.addEventListener('click', showNextQuestion);
        submitTestBtn.addEventListener('click', submitTest);
        reviewTestBtn.addEventListener('click', reviewTest);
        newTestBtn.addEventListener('click', startNewTest);

        // Monitor JSON input for progress
        jsonInput.addEventListener('input', updateJsonProgress);

        // Initialize
        function init() {
            updateJsonProgress();
        }

        // Update JSON progress bar
        function updateJsonProgress() {
            const text = jsonInput.value.trim();
            if (text.length === 0) {
                jsonProgress.style.width = '0%';
                return;
            }

            // Simple heuristic: if text looks like JSON (starts with [ and ends with ])
            // and has reasonable length, show progress
            const isJsonLike = text.startsWith('[') && text.includes('{') && text.includes('question');
            const lengthPercent = Math.min(100, text.length / 20);

            if (isJsonLike) {
                jsonProgress.style.width = '100%';
                jsonProgress.style.backgroundColor = '#28a745';
            } else {
                jsonProgress.style.width = lengthPercent + '%';
                jsonProgress.style.backgroundColor = lengthPercent > 50 ? '#ffc107' : '#dc3545';
            }
        }

        // Load questions from JSON input
        function loadQuestions() {
            const jsonText = jsonInput.value.trim();

            if (!jsonText) {
                alert("Please paste your questions in JSON format first.");
                return;
            }

            try {
                const parsedQuestions = JSON.parse(jsonText);

                if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
                    throw new Error("Questions should be in an array format with at least one question.");
                }

                // Validate each question has required fields
                for (let i = 0; i < parsedQuestions.length; i++) {
                    const q = parsedQuestions[i];
                    if (!q.question || !q.options || !Array.isArray(q.options) || !q.answer) {
                        throw new Error(`Question ${i + 1} is missing required fields (question, options, answer).`);
                    }
                }

                questions = parsedQuestions;
                startTest();

            } catch (error) {
                alert(`Error parsing JSON: ${error.message}\n\nPlease check your JSON format and try again.`);
                console.error(error);
            }
        }

        // Load sample questions
        function loadSampleQuestions() {
            questions = sampleQuestions;
            jsonInput.value = JSON.stringify(sampleQuestions, null, 2);
            updateJsonProgress();
            startTest();
        }

        // Clear input
        function clearInput() {
            jsonInput.value = '';
            updateJsonProgress();
        }

        // Toggle sample JSON visibility
        function toggleSampleJson() {
            const isVisible = sampleJson.style.display === 'block';
            sampleJson.style.display = isVisible ? 'none' : 'block';
            viewSampleBtn.innerHTML = isVisible ?
                '<i class="fas fa-eye"></i> View Sample' :
                '<i class="fas fa-eye-slash"></i> Hide Sample';
        }

        // Start the test
        function startTest() {
            // Initialize user answers array
            userAnswers = new Array(questions.length).fill(null);

            // Set up test info
            currentQuestionIndex = 0;
            testStarted = true;

            // Update UI
            totalQuestions.textContent = questions.length;

            // Start timer
            startTime = new Date();
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);

            // Show test section
            inputSection.classList.remove('active');
            testSection.classList.add('active');
            resultsSection.classList.remove('active');

            // Display first question
            displayQuestion();
        }

        // Update timer
        function updateTimer() {
            if (!startTime) return;

            const now = new Date();
            const diff = Math.floor((now - startTime) / 1000); // difference in seconds

            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;

            timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        // Display current question
        function displayQuestion() {
            if (currentQuestionIndex >= questions.length) {
                return;
            }

            const question = questions[currentQuestionIndex];

            // Update question info
            questionNumber.textContent = currentQuestionIndex + 1;
            currentQuestion.textContent = currentQuestionIndex + 1;
            questionText.textContent = question.question;

            // Clear options container
            optionsContainer.innerHTML = '';

            // Create option elements
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';

                // Check if user has selected this option
                if (userAnswers[currentQuestionIndex] === option) {
                    optionElement.classList.add('selected');
                }

                optionElement.textContent = `${String.fromCharCode(65 + index)}) ${option}`;

                optionElement.addEventListener('click', () => selectOption(option));

                optionsContainer.appendChild(optionElement);
            });

            // Update navigation buttons
            prevBtn.disabled = currentQuestionIndex === 0;
            nextBtn.disabled = currentQuestionIndex === questions.length - 1;

            // Update correct count
            updateCorrectCount();
        }

        // Select an option
        function selectOption(selectedOption) {
            userAnswers[currentQuestionIndex] = selectedOption;
            displayQuestion();
        }

        // Update correct answer count
        function updateCorrectCount() {
            let count = 0;

            for (let i = 0; i < questions.length; i++) {
                if (userAnswers[i] === questions[i].answer) {
                    count++;
                }
            }

            correctCount.textContent = count;
        }

        // Show previous question
        function showPreviousQuestion() {
            if (currentQuestionIndex > 0) {
                currentQuestionIndex--;
                displayQuestion();
            }
        }

        // Show next question
        function showNextQuestion() {
            if (currentQuestionIndex < questions.length - 1) {
                currentQuestionIndex++;
                displayQuestion();
            }
        }

        // Submit test
        function submitTest() {
            // Stop timer
            clearInterval(timerInterval);

            // Calculate results
            let correct = 0;
            let wrong = 0;

            for (let i = 0; i < questions.length; i++) {
                if (userAnswers[i] === questions[i].answer) {
                    correct++;
                } else {
                    wrong++;
                }
            }

            const percentage = Math.round((correct / questions.length) * 100);

            // Update results UI
            correctAnswers.textContent = correct;
            wrongAnswers.textContent = wrong;
            resultPercentage.textContent = `${percentage}%`;
            scorePercentage.textContent = `${percentage}%`;

            // Update score text based on percentage
            if (percentage >= 80) {
                scoreText.textContent = "Excellent Performance!";
                scoreText.style.color = "#28a745";
            } else if (percentage >= 60) {
                scoreText.textContent = "Good Performance";
                scoreText.style.color = "#17a2b8";
            } else if (percentage >= 40) {
                scoreText.textContent = "Average Performance";
                scoreText.style.color = "#ffc107";
            } else {
                scoreText.textContent = "Needs Improvement";
                scoreText.style.color = "#dc3545";
            }

            // Show results section
            inputSection.classList.remove('active');
            testSection.classList.remove('active');
            resultsSection.classList.add('active');
        }

        // Review test
        function reviewTest() {
            // Reset to first question
            currentQuestionIndex = 0;

            // Show test section with review mode
            inputSection.classList.remove('active');
            testSection.classList.add('active');
            resultsSection.classList.remove('active');

            // Display first question with correct/incorrect highlighting
            displayQuestionForReview();
        }

        // Display question in review mode
        function displayQuestionForReview() {
            if (currentQuestionIndex >= questions.length) {
                return;
            }

            const question = questions[currentQuestionIndex];
            const userAnswer = userAnswers[currentQuestionIndex];
            const correctAnswer = question.answer;

            // Update question info
            questionNumber.textContent = currentQuestionIndex + 1;
            currentQuestion.textContent = currentQuestionIndex + 1;
            questionText.textContent = question.question;

            // Clear options container
            optionsContainer.innerHTML = '';

            // Create option elements with highlighting
            question.options.forEach((option, index) => {
                const optionElement = document.createElement('div');
                optionElement.className = 'option';

                // Highlight correct answer
                if (option === correctAnswer) {
                    optionElement.classList.add('correct');
                }
                // Highlight wrong user selection
                else if (option === userAnswer && userAnswer !== correctAnswer) {
                    optionElement.classList.add('incorrect');
                }
                // Highlight user's correct selection
                else if (option === userAnswer && userAnswer === correctAnswer) {
                    optionElement.classList.add('selected', 'correct');
                }

                optionElement.textContent = `${String.fromCharCode(65 + index)}) ${option}`;
                optionsContainer.appendChild(optionElement);
            });

            // Update navigation buttons
            prevBtn.disabled = currentQuestionIndex === 0;
            nextBtn.disabled = currentQuestionIndex === questions.length - 1;

            // Change submit button to "Back to Results"
            submitTestBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Back to Results';
            submitTestBtn.onclick = showResults;
        }

        // Show results again
        function showResults() {
            inputSection.classList.remove('active');
            testSection.classList.remove('active');
            resultsSection.classList.add('active');

            // Reset submit button
            submitTestBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Test';
            submitTestBtn.onclick = submitTest;
        }

        // Start a new test
        function startNewTest() {
            // Reset everything
            questions = [];
            currentQuestionIndex = 0;
            userAnswers = [];
            testStarted = false;
            startTime = null;

            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            // Show input section
            inputSection.classList.add('active');
            testSection.classList.remove('active');
            resultsSection.classList.remove('active');

            // Reset submit button
            submitTestBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Test';
            submitTestBtn.onclick = submitTest;
        }

        // Initialize the app
        init();
    