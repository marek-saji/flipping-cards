(function (global, document, Math) {

    'use strict';
    
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
        
        if ('function' !== typeof Array.prototype.keys)
        {
            missingFeatures.push('Array.prototype.keys');
        }
        
        if ('function' !== typeof Array.prototype.forEach)
        {
            missingFeatures.push('Array.prototype.forEach');
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
        
        if (! supportsEmoji())
        {
            missingFeatures.push('emoji font');
        }

        if (missingFeatures.length && debug())
        {
            alert("Not enhancing, missing features:\n" + missingFeatures.join("\n"));
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
     * Put “Start practice” button on page
     */
    function addStartPracticeButton ()
    {
        var startPracticeButton;
        startPracticeButton = document.createElement('button');
        startPracticeButton.setAttribute('type', 'button');
        startPracticeButton.classList.add('fcard__startPractise');
        startPracticeButton.textContent = 'Start practice';
        
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
            languages: {}
        };
        var textElements = element.querySelectorAll('[lang]');
        var textElement, lang;
        var idx;
        for (idx = 0; idx < textElements.length; idx += 1)
        {
            textElement = textElements[idx];
            lang = textElement.lang;
            if (! item.languages[lang])
            {
                item.languageCodes.push(lang);
                item.languages[lang] = [];
            }
            item.languages[lang].push(textElement.textContent);
        }
        
        return item;
    }
    
    
    /**
     * Collect all items from the page
     */
    function collectItems ()
    {
        var elements = document.querySelectorAll('[data-fcard-item]');
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
                answer: item.element
            }};
        }};
    };
    
    
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
        
        endPracticeButton = document.createElement('button');
        endPracticeButton.textContent = '❌';
        endPracticeButton.classList.add('fcard__endPractice');
        endPracticeButton.addEventListener('click', endPractice);
        backdrop.appendChild(endPracticeButton);
        
        document.getElementsByTagName('body')[0].appendChild(backdrop);
    }
    
    
    /**
     * Start practice session
     */
    function startPractice ()
    {
        var items = collectItems();
        var itemGenerator = createItemGenerator(items);
        var question;
        var cards = new Array(2);
        var activeCardIdx;
        
        if (undefined === backdrop)
        {
            activateBackdrop();
        }
        
        for (activeCardIdx=0; activeCardIdx<cards.length; activeCardIdx += 1)
        {
            cards[activeCardIdx] = new FlippingCard(backdrop, itemGenerator);
            cards[activeCardIdx].onWrongAnswer = cards[activeCardIdx].onCorrectAnswer = function () {
                var activeCard;
                var prevCard = cards[activeCardIdx];
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
        addStartPracticeButton();
    }

}(window, document, Math, undefined));