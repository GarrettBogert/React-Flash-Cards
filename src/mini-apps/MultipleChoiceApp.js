import React, { useState, useEffect } from 'react';
import * as Questions from '../PrefabQuizzes/Quizzes.js';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';

export default function MultipleChoiceApp(props) {

    const getLocalStorageQuizzes = () => {
        const rawQuizzes = JSON.parse(localStorage.getItem('quizzes'));
        return rawQuizzes ?? [];
    };

    const [quizActive, setQuizActive] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    //userHasGuessed will allow the display to indicate whether the guess was correct or not
    const [userHasGuessed, setUserHasGuessed] = useState(false);
    //The index of the current question from the quizPool being displayed.    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState();
    const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState([]);
    const [incorrectlyAnsweredQuestions, setIncorrectlyAnsweredQuestions] = useState([]);
    const [currentlySelectedAnswer, setCurrentlySelectedAnswer] = useState(null);
    const [checkedCategories, setCheckedCategories] = useState([]);

    //quizPool is a collection of quizzes that will get initialized once a quiz is started with categories selected. 
    const [questionPool, setQuestionPool] = useState([]);
    const [userQuestions, setUserQuestions] = useState(getLocalStorageQuizzes())

    function getRandomQuestion(quizPool) {
        if (quizPool.length > 0) {
            let currentQuizIndex = Math.floor(Math.random() * quizPool.length - 1) + 1;
            setCurrentQuestionIndex(currentQuizIndex);
            let question = quizPool[currentQuizIndex];
            //This hasMultipleAnswers property is essential in rendering single answer quizzes versus multiple answer differently.
            let valueOfAnswersArray = typeof (question.correctAnswer);
            question.hasMultipleAnswers = valueOfAnswersArray !== 'number';
            return question;
        }
    }

    function ArraysAreEqual(arr1, arr2) {
        arr1.sort();
        arr2.sort();
        if (arr1.length !== arr2.length)
            return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i])
                return false;
        }
        return true;

    }

    const handleSubmitClick = () => {
        if (currentlySelectedAnswer === null)
            return;
        setUserHasGuessed(true);
        if (currentQuestion.hasMultipleAnswers) {
            if (ArraysAreEqual(currentlySelectedAnswer, currentQuestion.correctAnswer)) {
                setCorrectlyAnsweredQuestions(prevAnswered => [...prevAnswered, currentQuestion]);
            }
            else {
                setIncorrectlyAnsweredQuestions(prevAnswered => [...prevAnswered, currentQuestion]);
            }
        }
        else {
            if (currentlySelectedAnswer === currentQuestion.correctAnswer) {
                setCorrectlyAnsweredQuestions(prevAnswered => [...prevAnswered, currentQuestion]);
            }
            else {
                setIncorrectlyAnsweredQuestions(prevAnswered => [...prevAnswered, currentQuestion]);
            }
        }

        //We filter out the answered question from the pool, to avoid it being presented twice.  
        setQuestionPool(oldPool => oldPool.filter((question, index) => index !== currentQuestionIndex));
    }

    const populateNextQuestion = () => {
        if (questionPool.length > 0) {
            let question = getRandomQuestion(questionPool);
            setCurrentQuestion(question);
            setUserHasGuessed(false);
            setCurrentlySelectedAnswer(null)
        }
        else {
            window.alert("Quiz complete!")
        }
    };

    const handleCancelQuizClick = () => {
        setUserHasGuessed(false);
        setIncorrectlyAnsweredQuestions([]);
        setCorrectlyAnsweredQuestions([]);
        setCurrentQuestion(null);
        setQuizActive(false);
        setCurrentlySelectedAnswer(null);
        setQuestionPool([]);
        setCurrentQuestionIndex(null);
    }

    const handleNextQuestionClick = () => {
        setCurrentlySelectedAnswer(null);
        populateNextQuestion();
    }

    const onChangeSelectedAnswer = (event) => {
        setCurrentlySelectedAnswer(parseInt(event.target.value));
    }

    const onChangeSelectedAnswers = (event) => {
        let checkBoxes = [...event.currentTarget.children];
        let checkedBoxes = checkBoxes.filter(box => box.control.checked);
        let checkedValues = checkedBoxes.map(box => parseInt(box.control.value));
        setCurrentlySelectedAnswer(checkedValues);
    }

    function getQuestionChoicesAsCheckbox() {
        return (
            currentQuestion.answerChoices.map((choice, index) => {
                return (
                    <FormControlLabel
                        control={
                            <Checkbox
                                disabled={userHasGuessed}
                                checked={currentlySelectedAnswer !== null ? currentlySelectedAnswer.includes(index) : false}
                                value={index}
                                name={'questionChoice'} />
                        }
                        label={userHasGuessed ?
                            currentQuestion.correctAnswer.includes(index) ? choice + "(correct)" : choice + "(incorrect)" : choice}
                    />
                )
            }
            )
        )
    }

    function getQuestionChoicesAsRadio() {
        return (
            currentQuestion.answerChoices.map((choice, index) => {
                return (
                    <FormControlLabel value={index} control={<Radio />} label={userHasGuessed ?
                        currentQuestion.correctAnswer === index ? choice + "(correct)" : choice : choice} />
                )
            }
            )
        )
    }


    const categoriesWithQuizzes = () => {
        let categoriesThatHaveQuizzes = Questions.getAll().map(q => q.category);
        let distinctCategories = [...new Set(categoriesThatHaveQuizzes)];
        return distinctCategories;
    }

    function renderRelevantButtons() {
        return (
            quizActive ? <>
                <Button
                    variant='contained'
                    color='primary'
                    onClick={userHasGuessed ? handleNextQuestionClick : handleSubmitClick}>
                    {userHasGuessed ? 'Next Question' : 'Submit Answer'}
                </Button>
            </>
                : <Button
                    variant='contained'
                    color='primary'
                    onClick={handleStartQuizClick}>
                    Start Quiz
                </Button>
        )
    }

    function renderConsulationForBadQuizTaker() {
        return (
            quizActive && questionPool.length === 0 && correctlyAnsweredQuestions.length === 0 ?
                <form action="https://zealous-glacier-069535a10.azurestaticapps.net">
                    <label>You seem to have struggled with this quiz. Maybe it's time to take a break?</label>
                    <Button type="submit"
                        variant='contained'
                        color='primary' >
                        "Blow off some steam!"
                        </Button>
                </form> : null
        )
    }

    const handleCategoryCheckboxChange = (event) => {
        const { value } = event.target;
        setCheckedCategories(value);
    };

    const handleStartQuizClick = () => {
        if (checkedCategories.length > 0) {
            let requestedQuestions = Questions.getPool(checkedCategories, userQuestions);
            if (requestedQuestions.length > 0) {
                //The useEffect hook on quizPool will cause the next quiz to display after this call finishes.
                setQuestionPool(requestedQuestions);
                setQuizActive(true);
                let firstQuestion = getRandomQuestion(requestedQuestions);
                setCurrentQuestion(firstQuestion);

            }
            else {
                window.alert("Selected categories contained no quizzes");
            }
        }
        else {
            window.alert("Please check at least one category to start a quiz session")
        }
    }

    return (
        <>
            <h1 className='miniapptitle'>Multiple choice quizzes</h1>
            {checkedCategories.length === 0 ?
                <>
                    <div>To get started, select one or many categories below and click 'Start Quiz' to begin a quiz session</div>
                </>
                : null
            }
            {currentQuestion !== null ? (
                <TextField
                    id="outlined-multiline-static"
                    label="Question"
                    multiline
                    value={currentQuestion.question}
                    variant="outlined"
                />
            )
                : null
            }

            {currentQuestion !== null ? currentQuestion.hasMultipleAnswers ?
                (
                    <div className="centered"> 
                        <FormGroup
                            onChange={onChangeSelectedAnswers}>
                            {getQuestionChoicesAsCheckbox()}
                        </FormGroup>
                    </div>

                )
                :
                (<RadioGroup
                    value={currentlySelectedAnswer}
                    onChange={onChangeSelectedAnswer}>
                    {getQuestionChoicesAsRadio()}
                </RadioGroup>
                ) : null
            }
            <div className='centered'>
                {!quizActive ? props.renderSelectableCategories(categoriesWithQuizzes, checkedCategories, handleCategoryCheckboxChange) : null}
            </div>
            {renderRelevantButtons()}
            {
                quizActive ?
                    <>
                        <label className='small'>{`Current question's category: ${currentQuestion.category}`}</label>
                        <label className='small'>{`${correctlyAnsweredQuestions.length} correct answers.`}</label>
                        <label className='small'>{`${incorrectlyAnsweredQuestions.length} incorrect answers.`}</label>
                    </>
                    : null
            }
            {quizActive ? <Button
                size='small'
                variant='outlined'
                color='secondary'
                onClick={handleCancelQuizClick}>
                Cancel quiz
                    </Button>
                : null
            }

            {renderConsulationForBadQuizTaker()}


        </>
    )
}



