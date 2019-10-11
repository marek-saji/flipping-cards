(function (global, document) {

    'use strict';


    /**
     * Length above which content is considered short
     */
    var CONTENT_LENGTH_SHORT = 7;
    /**
     * Length above which content is considered long
     */
    var CONTENT_LENGTH_LONG = 100;



    /**
     * Create a new flippin’ card
     *
     * @param {Element} container - DOM Element to append card to
     * @param {object} itemGenerator.next - Used to get next item. Must return object with `value` property.
     * @param {object} messages
     * @constructor
     */
    function FlippingCard (container, itemGenerator, messages)
    {
        if (!(container instanceof Element))
        {
            throw new TypeError('contaier must be a DOM Element');
        }

        if (
            !(itemGenerator instanceof Object) ||
            !(itemGenerator.next instanceof Function)
        )
        {
            throw new TypeError('itemGenerator must be a generator');
        }

        this.messages = messages;


        this.setItemGenerator = itemGenerator;
        this.prepareDom(container);
        this.setupFresh();
    }


    /**
     * Set content to a DOM Element
     *
     * @param {Element} element
     * @param {string|Element} content - When Element is given, will use
     *        it's outer HTML, otherwise will be used as a text value
     */
    function setElementContent (element, content)
    {
        var disambiguation;

        if (!(element instanceof Element))
        {
            throw new TypeError('element must be a DOM Element');
        }

        if (content instanceof Element)
        {
            element.innerHTML = content.outerHTML;
            if (content.dataset.fcardDisambiguation)
            {
                disambiguation = document.createElement('small');
                disambiguation.classList.add('fcard__card__disambiguation');
                disambiguation.textContent = content.dataset.fcardDisambiguation;
                element.appendChild(document.createTextNode(' '));
                element.appendChild(disambiguation);
            }
        }
        else
        {
            element.innerHTML = content;
        }

    }


    /**
     * Create DOM elements and put them in the container
     *
     * Card is hidden by default, {@see appear}.
     *
     * @param {Element} container
     */
    FlippingCard.prototype.prepareDom = function (container) {

        if (!(container instanceof Element))
        {
            throw new TypeError('contaier must be a DOM Element');
        }

        var questionNav, answerNav;
        var revealAnswer, gotItWrong, gotItCorrect;

        this.question = document.createElement('section');
        this.answer = document.createElement('section');
        this.cards = document.createElement('dl');
        this.questionCard = document.createElement('dd');
        this.answerCard = document.createElement('dt');
        questionNav = document.createElement('nav');
        answerNav = document.createElement('nav');
        revealAnswer = document.createElement('button');
        gotItWrong = document.createElement('button');
        gotItCorrect = document.createElement('button');


        // attributes

        this.question.classList.add('fcard__card__content');
        questionNav.classList.add('fcard__card__nav');
        this.answer.classList.add('fcard__card__content');
        answerNav.classList.add('fcard__card__nav');

        this.cards.classList.add('fcard__card');
        this.cards.classList.add('fcard__card');

        this.questionCard.classList.add('fcard__card__question');
        this.questionCard.setAttribute('tabindex', 1);

        this.answerCard.classList.add('fcard__card__answer', 'fcard__card__answer--flipped');
        this.answerCard.setAttribute('tabindex', 1);

        revealAnswer.setAttribute('type', 'button');
        gotItWrong.setAttribute('type', 'button');
        gotItCorrect.setAttribute('type', 'button');

        revealAnswer.textContent = this.messages.revealAnswer;
        gotItWrong.textContent = this.messages.gotItWrong;
        gotItCorrect.textContent = this.messages.gotItCorrect;




        // events

        revealAnswer.addEventListener('click', this.showAnswer.bind(this));
        gotItWrong.addEventListener('click', this.wrongAnswer.bind(this));
        gotItCorrect.addEventListener('click', this.correctAnswer.bind(this));

        this.questionCard.addEventListener('keydown', this.questionKeydownHandler.bind(this));
        this.answerCard.addEventListener('keydown', this.answerKeydownHandler.bind(this));


        // put together

        questionNav.appendChild(revealAnswer);
        answerNav.appendChild(gotItWrong);
        answerNav.appendChild(gotItCorrect);

        this.questionCard.appendChild(this.question);
        this.questionCard.appendChild(questionNav);

        this.answerCard.appendChild(this.answer);
        this.answerCard.appendChild(answerNav);

        this.cards.appendChild(this.questionCard);
        this.cards.appendChild(this.answerCard);
        container.appendChild(this.cards);
    };


    /**
     * Setup card using item generator
     */
    FlippingCard.prototype.setupFresh = function () {
        var item = this.setItemGenerator.next().value;
        this.setQuestion(item);
        this.setAnswer(item);
    };


    /**
     * Set question content
     *
     * @param {Object} item
     * @param {string} item.question
     */
    FlippingCard.prototype.setQuestion = function (item) {
        this.question.scrollTop = 0;
        setElementContent(this.question, item.question);
        this.question.classList.toggle(
            'fcard__card__content--short',
            this.question.textContent.length < CONTENT_LENGTH_SHORT
        );
        this.question.classList.toggle(
            'fcard__card__content--long',
            this.question.textContent.length > CONTENT_LENGTH_LONG
        );
    };


    /**
     * Set answre content
     *
     * @param {Object} item
     * @param {string} item.answer
     * @param {[Element[]]} item.examples
     */
    FlippingCard.prototype.setAnswer = function (item) {
        var examplesContainer;
        var examplesHtml;
        this.question.scrollTop = 0;
        setElementContent(this.answer, item.answer);
        if (item.examples)
        {
            examplesHtml = item.examples
                .map(function (example) {
                    return example.outerHTML;
                })
                .join('');
            if (examplesHtml)
            {
                examplesContainer = document.createElement('aside');
                examplesContainer.classList.add('fcard__card__examples');
                examplesContainer.innerHTML = examplesHtml;
                this.answer.appendChild(examplesContainer);
            }
        }
        this.answer.classList.toggle(
            'fcard__card__content--short',
            this.answer.textContent.length < CONTENT_LENGTH_LONG
        );
        this.answer.classList.toggle(
            'fcard__card__content--long',
            this.answer.textContent.length > CONTENT_LENGTH_LONG
        );
    };


    /**
     * Enable or disable all buttons in the card
     *
     * @param {boolean} toggle
     */
    FlippingCard.prototype.toggleButtonsState = function (toggle) {
        Array.prototype.forEach.call(
            this.cards.querySelectorAll('button'),
            function (button) {
                button.disabled = ! toggle;
            }
        );
    };


    /**
     * Enable all buttons in the card
     */
    FlippingCard.prototype.enableButtons = function () {
        this.toggleButtonsState(true);
    };


    /**
     * Disable all buttons in the card
     */
    FlippingCard.prototype.disableButtons = function () {
        this.toggleButtonsState(false);
    };


    /**
     * Make card disappear
     */
    FlippingCard.prototype.disappear = function () {
        this.cards.classList.remove('fcard__card--onscreen');
        this.disableButtons();
    };


    /**
     * Make card disappear after wrong answer
     */
    FlippingCard.prototype.disappearWrong = function () {
        this.cards.classList.add('fcard__card--wrong');
        this.disappear();
    };


    /**
     * Make card disappear after correct answer
     */
    FlippingCard.prototype.disappearCorrect = function () {
        this.cards.classList.add('fcard__card--correct');
        this.disappear();
    };


    /**
     * Make card appear
     */
    FlippingCard.prototype.appear = function () {
        this.showQuestion();
        this.cards.classList.remove('fcard__card--wrong');
        this.cards.classList.remove('fcard__card--correct');
        this.cards.offsetHeight;
        this.cards.classList.add('fcard__card--onscreen');
        this.enableButtons();
    };


    /**
     * Show question side of the card
     */
    FlippingCard.prototype.showQuestion = function () {
        var wrapper = this.questionCard.parentElement.parentElement;
        var wrapperScrollLeft = wrapper.scrollLeft;

        this.questionCard.classList.remove('fcard__card__question--flipped');
        this.answerCard.classList.add('fcard__card__answer--flipped');
        this.questionCard.focus();

        // Restore scroll position that may have been changed with focus
        wrapper.scrollLeft = wrapperScrollLeft;
    };


    /**
     * Show answer side of the card
     */
    FlippingCard.prototype.showAnswer = function () {
        this.questionCard.classList.add('fcard__card__question--flipped');
        this.answerCard.classList.remove('fcard__card__answer--flipped');
        this.answerCard.focus();
    };


    /**
     * React to incorrect answer
     */
    FlippingCard.prototype.wrongAnswer = function () {
        this.disappearWrong();
        this.onWrongAnswer();
    };


    /**
     * React to correct answer
     */
    FlippingCard.prototype.correctAnswer = function () {
        this.disappearCorrect();
        this.onCorrectAnswer();
    };


    /**
     * Handle keydown event on question card
     */
    FlippingCard.prototype.questionKeydownHandler = function (event) {
        if (40 === event.keyCode)
        {
            this.showAnswer();
            event.preventDefault();
        }
    };


    /**
     * Handle keydown event on answer card
     */
    FlippingCard.prototype.answerKeydownHandler = function (event) {
        if (37 === event.keyCode)
        {
            this.wrongAnswer();
            event.preventDefault();
        }
        if (39 === event.keyCode)
        {
            this.correctAnswer();
            event.preventDefault();
        }
    };


    // Export
    global.FlippingCard = FlippingCard;

}(window, document));
