(function (global, document, Math) {

    'use strict';

    var MESSAGES_BY_LANGUAGE = {
        en: {
            startPractice: 'Start practice',
            revealAnswer: '↷ show answer',
            gotItWrong: '😞 got it wrong',
            gotItCorrect: '😃 got it correct',
            noItemsError: 'No flippin’ items found. 😞'
        },
        pl: {
            startPractice: 'Rozpocznij naukę',
            revealAnswer: '↷ pokaż odpowiedź',
            gotItWrong: '😞 nie wiedziałem',
            gotItCorrect: '😃 wiedziałem',
            noItemsError: 'Nie znalazłem żadnych elementów do uczenia. 😞'
        }
    };

    var messages;
    var backdrop;

    /**
     * Check whether debug is enabled
     *
     * @return {boolean}
     */
    function debug ()
    {
        return -1 !== global.location.hash.indexOf('debug');
    }

    /**
     * Check whether browser is cool enough for
     * enhancements
     *
     * @return {boolean}
     */
    function isCoolEnough ()
    {
        var missingFeatures = [];
        var element = document.createElement('i');

        if ('function' !== typeof document.querySelector)
        {
            missingFeatures.push('document.querySelector');
        }

        if ('function' !== typeof document.querySelectorAll)
        {
            missingFeatures.push('document.querySelectorAll');
        }

        if ('function' !== typeof Array.prototype.forEach)
        {
            missingFeatures.push('Array.prototype.forEach');
        }

        if ('function' !== typeof Object.keys)
        {
            missingFeatures.push('Object.keys');
        }

        if ( !global.CSS)
        {
            missingFeatures.push('window.CSS');
        }
        else if ('function' !== typeof global.CSS.supports)
        {
            missingFeatures.push('window.CSS.supports');
        }
        else
        {
            if (! global.CSS.supports('width', 'calc(1em)'))
            {
                missingFeatures.push('CSS: calc');
            }

            if (! global.CSS.supports('width', '1vw'))
            {
                missingFeatures.push('CSS: vw unit');
            }
        }

        if ('function' !== typeof element.addEventListener)
        {
            missingFeatures.push('element.addEventListener');
        }

        if (undefined === element.classList)
        {
            missingFeatures.push('element.classList');
        }

        if (undefined === element.dataset)
        {
            missingFeatures.push('element.dataset');
        }

        if (! supportsEmoji())
        {
            missingFeatures.push('emoji font');
        }

        if (missingFeatures.length && debug())
        {
            alert('Not enhancing, missing features:\n' + missingFeatures.join('\n'));
        }

        return 0 === missingFeatures.length;
    }


    /**
     * Detect emoji support by checking whether
     * two different emojis are rendered the same
     */
    function supportsEmoji ()
    {
        var canvas, context;
        var data1, data2;

        canvas = document.createElement('canvas');

        if (
            ! canvas.getContext ||
            ! canvas.getContext('2d') ||
            typeof canvas.getContext('2d').fillText !== 'function'
        )
        {
            return false;
        }
        else
        {
            context = canvas.getContext('2d');
            context.textBaseline = 'top';
            context.font = '16px sans-serif';
            context.fillText('😞', 0, 0);
            data1 = context.getImageData(0, 0, 16, 16).data;
            context.fillText('😃', 32, 32);
            data2 = context.getImageData(32, 32, 16, 16).data;

            return stringifyImageData(data1) !== stringifyImageData(data2);
        }
    }


    /**
     * Stringify image data
     *
     * Can't just call ImageData.join(), because Safair does not support it
     *
     * @param {ImageData}
     */
    function stringifyImageData (data)
    {
        if ('function' === typeof data.join)
        {
            return data.join('');
        }
        else
        {
            return Array.prototype.join.call(data, '');
        }
    }


    /**
     * Assign messages to {@see messages}
     *
     * @param {string} language
     */
    function setupMessages (language)
    {
        var idx;
        var customMessagesSource;
        var customMessages;
        var languages = [
            language,
            language.toLowerCase(),
            language.split(/[_-]/)[0],
            language.split(/[_-]/)[0].toLowerCase()
        ];

        for (idx=0; idx < languages.length; idx += 1)
        {
            if (languages[idx] in MESSAGES_BY_LANGUAGE)
            {
                messages = MESSAGES_BY_LANGUAGE[languages[idx]];
                break;
            }
        }

        if (! messages)
        {
            messages = Object.keys(MESSAGES_BY_LANGUAGE)[0];
        }

        customMessagesSource = document.querySelector('[data-fcard-messages]');
        if (customMessagesSource)
        {
            customMessages = JSON.parse(customMessagesSource.dataset.fcardMessages);
            Object.keys(messages).forEach(function (messageId) {
                if (messageId in customMessages)
                {
                    messages[messageId] = customMessages[messageId];
                }
            });
        }
    }


    /**
     * Put “Start practice” button on page
     */
    function addStartPracticeButton ()
    {
        var startPracticeButton;
        startPracticeButton = document.createElement('button');
        startPracticeButton.setAttribute('type', 'button');
        startPracticeButton.classList.add('fcard__startPractise');
        startPracticeButton.textContent = messages.startPractice;

        startPracticeButton.addEventListener(
            'click',
            startPractice
        );

        document.querySelector('[data-fcard-place-for-start-practice-button]').appendChild(startPracticeButton);
    }


    /**
     * Create an item from DOM Element
     *
     * @param {Element} element - Element with [data-fcard-item]
     * @return {Object}
     */
    function createItemFromElement (element)
    {
        var item = {
            element: element,
            languageCodes: [],
            languages: {},
            examples: [],
            tags: []
        };
        var textElements = element.querySelectorAll('[lang]');
        var textElement, lang;
        var idx;
        var exampleIds, example;

        for (idx = 0; idx < textElements.length; idx += 1)
        {
            textElement = textElements[idx];
            lang = textElement.lang;
            if (! item.languages[lang])
            {
                item.languageCodes.push(lang);
                item.languages[lang] = [];
            }
            item.languages[lang].push(textElement);
        }

        exampleIds = ( element.dataset.fcardExample || '' ).split(/ +/);
        for (idx = 0; idx < exampleIds.length; idx += 1)
        {
            example = document.getElementById(exampleIds[idx]);
            if (example)
            {
                item.examples.push(example);
            }
        }

        item.tags = ( element.dataset.fcardTags || '' ).split(/ +/);

        return item;
    }


    /**
     * Collect all items from the page
     */
    function collectItems ()
    {
        var elements = document.querySelectorAll('[data-fcard-item]');
        if (0 === elements.length)
        {
            alert(messages.noItemsError);
            throw new Error(messages.noItemsError);
        }

        return Array.prototype.map.call(elements, createItemFromElement);
    }


    /**
     * Get random element from an array
     *
     * @param {Array} array
     * @return Random element
     */
    function randomElement (array)
    {
        return array[ Math.floor(Math.random() * array.length) ];
    }

    function createItemGenerator (items) {
        return {next: function () {
            var item = randomElement(items);
            var lang = randomElement(item.languageCodes);
            return {value: {
                question: randomElement(item.languages[lang]),
                answer: item.element.outerHTML,
                examples: item.examples,
                tags: item.tags
            }};
        }};
    }


    /**
     * Show backdrop
     */
    function activateBackdrop ()
    {
        var endPracticeButton;

        backdrop = document.createElement('section');
        backdrop.classList.add('fcard__card__wrapper');
        backdrop.addEventListener('keydown', function (event) {
            if (27 === event.keyCode)
            {
                endPractice();
            }
        });
        document.body.setAttribute('data-fcard-active', true);

        endPracticeButton = document.createElement('button');
        endPracticeButton.textContent = '❌';
        endPracticeButton.classList.add('fcard__endPractice');
        endPracticeButton.addEventListener('click', endPractice);
        backdrop.appendChild(endPracticeButton);

        backdrop.addEventListener('click', function (event) {
            if (backdrop === event.target)
            {
                endPracticeButton.classList.remove('fcard__endPractice--attention');
                endPracticeButton.offsetHeight;
                endPracticeButton.classList.add('fcard__endPractice--attention');
            }
        });

        document.body.appendChild(backdrop);
    }


    /**
     * Start practice session
     */
    function startPractice ()
    {
        var items = collectItems();
        var itemGenerator = createItemGenerator(items);
        var cards = new Array(2);
        var activeCardIdx;

        if (undefined === backdrop)
        {
            activateBackdrop();
        }

        for (activeCardIdx=0; activeCardIdx<cards.length; activeCardIdx += 1)
        {
            cards[activeCardIdx] = new FlippingCard(backdrop, itemGenerator, messages);
            cards[activeCardIdx].onWrongAnswer = cards[activeCardIdx].onCorrectAnswer = function () {
                var activeCard;
                activeCardIdx = ( activeCardIdx + 1 ) % cards.length;
                activeCard = cards[ activeCardIdx ];
                activeCard.setupFresh();
                activeCard.appear();
            };
        }
        activeCardIdx = 0;
        cards[activeCardIdx].appear();
    }


    /**
     * End practice
     */
    function endPractice ()
    {
        if (backdrop instanceof Element)
        {
            backdrop.remove();
            backdrop = undefined;
            document.body.removeAttribute('data-fcard-active');
        }
    }

    if (debug())
    {
        document.documentElement.className += ' debug';
        global.onerror = function (error) {
            alert(error);
        };
    }


    if (isCoolEnough())
    {
        setupMessages(document.documentElement.lang || navigator.language);
        addStartPracticeButton();
    }

}(window, document, Math, undefined));
