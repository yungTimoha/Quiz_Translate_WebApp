// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyB7PTCzm-NKAOrPAfMe5Coj1CDwhXtZCFM",
//   authDomain: "quiztranslatewebapiproject.firebaseapp.com",
//   projectId: "quiztranslatewebapiproject",
//   storageBucket: "quiztranslatewebapiproject.appspot.com",
//   messagingSenderId: "589394125929",
//   appId: "1:589394125929:web:49c17f46e6cdc1fb112ef8",
//   measurementId: "G-VX3T36B34V"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

document.addEventListener('DOMContentLoaded', function () {
    const apiKey = '24gcMb1SKRQFXjGwaQ72yvI4TURMIRXqIPFLVNr2';
    const apiUrl = 'https://quizapi.io/api/v1/questions';
    const questionLimit = 5;
    let currentQuestionIndex = 0;
    let correctAnswers = 0;
    let fetchedQuestions = [];

    const fetchData = async (category = '', difficulty = '') => {
        const categoryParam = category ? `&category=${category}` : '';
        const difficultyParam = difficulty ? `&difficulty=${difficulty}` : '';
        try {
            const response = await fetch(`${apiUrl}?apiKey=${apiKey}&limit=${questionLimit}${categoryParam}${difficultyParam}`);
            const data = await response.json();
            if (data.length > 0) {
                fetchedQuestions = data; // Сохраняем полученные вопросы
                displayQuestion(data[currentQuestionIndex]);
            } else {
                throw new Error('No questions found');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('https://quizapi.io/api/v1/categories', {
                headers: {
                    'X-Api-Key': apiKey
                }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    };

    const showSettingsModal = async () => {
        const categories = await fetchCategories();
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Выберите категорию и сложность вопросов</h2>
                <form id="settingsForm">
                    <label for="category">Категория:</label>
                    <select id="category" name="category">
                        <option value="">Все категории</option>
                        ${categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('')}
                    </select>
                    <label for="difficulty">Сложность:</label>
                    <select id="difficulty" name="difficulty">
                        <option value="">Любая сложность</option>
                        <option value="easy">Легкие</option>
                        <option value="medium">Средние</option>
                        <option value="hard">Сложные</option>
                    </select>
                    <button type="submit" id="submitButton">Начать тест</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    
        const settingsForm = document.getElementById('settingsForm');
        const submitButton = document.getElementById('submitButton'); // Получаем кнопку по id
        submitButton.addEventListener('click', (event) => {
            event.preventDefault();
            checkAnswer(); // Вызываем функцию checkAnswer при нажатии на кнопку
        }); 
    
        settingsForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const category = formData.get('category');
            const difficulty = formData.get('difficulty');
            await fetchData(category, difficulty);
            document.body.removeChild(modal);
        });
    };

    const displayQuestion = async (questionData) => {
        const questionElement = document.querySelector('.quiz-header h2');
        const answerElements = document.querySelectorAll('.quiz-header ul li label');
    
        if (questionData) {
            // Переводим текст вопроса
            const translatedQuestion = await translateText(questionData.question);
            questionElement.textContent = translatedQuestion;
    
            // Оставляем варианты ответов на английском
            const answers = Object.values(questionData.answers);
            answerElements.forEach((label, index) => {
                label.textContent = answers[index];
            });
        } else {
            questionElement.textContent = "Ошибка: вопрос не найден";
            answerElements.forEach((label) => {
                label.textContent = "";
            });
        }
    };

    const translateText = async (text) => {
        const langpair = 'en|ru'; // Переводим с английского на русский
        try {
            const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`);
            const data = await response.json();
            return data.responseData.translatedText;
        } catch (error) {
            console.error('Error translating text:', error);
            return text; // Возвращаем исходный текст в случае ошибки
        }
    };

    const checkAnswer = () => {
        const selectedAnswer = document.querySelector('input[name="answer"]:checked');
        if (selectedAnswer) {
            const currentQuestionData = fetchedQuestions[currentQuestionIndex];
            const answerIndex = selectedAnswer.id; // Индекс выбранного ответа
            const correctAnswerKey = `answer_${answerIndex}_correct`; // Формируем ключ правильного ответа
            if (currentQuestionData.correct_answers[correctAnswerKey] === "true") {
                correctAnswers++;
            }
            currentQuestionIndex++;
            if (currentQuestionIndex < questionLimit) {
                displayQuestion(fetchedQuestions[currentQuestionIndex]);
            } else {
                showResultsModal();
            }
        } else {
            alert('Пожалуйста, выберите ответ.');
        }
    };
    

    const showResultsModal = () => {
        const modal = document.createElement('div');
        modal.classList.add('modal');
        modal.innerHTML = `
            <div class="modal-content">
                <p>Вы ответили правильно на ${correctAnswers} из ${questionLimit} вопросов!</p>
                <button id="closeModalButton" class="button">Закрыть</button>
                <button id="restartButton" class="button">Попробовать еще раз</button>
            </div>
        `;
        document.body.appendChild(modal);
        const closeModalButton = document.getElementById('closeModalButton');
        const restartButton = document.getElementById('restartButton'); // Получаем кнопку "Попробовать еще раз" по id
        closeModalButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            resetQuiz(); // Добавлен вызов функции для сброса викторины
        });
        restartButton.addEventListener('click', () => {
            document.body.removeChild(modal);
            resetQuiz(); // Добавлен вызов функции для сброса викторины
            showSettingsModal(); // Показываем модальное окно с настройками снова
        });
    };

    const resetQuiz = () => {
        currentQuestionIndex = 0;
        correctAnswers = 0;
        fetchedQuestions = [];
    };

    // Fetch questions on page load
    showSettingsModal();
});
