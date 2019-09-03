/**
 * Plugin Name: JS Slider
 * Version: 1.0.0
 * Author: Joomshaper
 * Company: Joomshaper
 * Website: https://www.joomshaper.com/
 * Description: Joomshaper Slider 
 */
; (function ($, window, document, undefined) {

    var pluginName = 'jsSlider';

    // Create the plugin constructor
    function Plugin(element, options) {
        /*
            Provide local access to the DOM node(s) that called the plugin,
            as well local access to the plugin name and default options.
        */
        this.element = element;
        this.elementWidth = 0
        this._name = pluginName;
        this.item = null;
        this.delta = 1;
        this.isAnimating = false;

        //interval clear 
        this.timer = 0;
        this._timeoutId1 = 0;
        this._timeoutId2 = 0;
        this._dotControllerTimeId = 0;
        this._lastViewPort = 0


        this.itemWidth = 0
        this._clones = 0
        this._items = 0

        this._itemCoordinate = []
        this.coordinate = { x: 0, y: 0 };
        this.prevCoordinate = { x: 0, y: 0, diff: 0, dragPointer: -1 };

        this._defaults = $.fn.jsSlider.defaults;
        /*
            The "$.extend" method merges the contents of two or more objects,
            and stores the result in the first object.
        */
        this.options = $.extend({}, this._defaults, options, { autoplay: false })

        //Check if speed is bigger than interval then make they both equal
        if( this.options.speed > this.options.interval ){
            this.options.speed = this.options.interval 
        }


        /*
            The "init" method is the starting point for all plugin logic.
        */
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {

            // Build cache for first rendering and search target element
            this.buildCache();

            // Create necessary html DOM and element cache
            this.createHtmlDom();

            // Apply initial style for next initiative
            this.applyBasicStyle();

            // Apply all bind event into this function
            this.bindEvents();

            // On inital start animation
            this.triggerOnStart()
        },

        // Trigger animation element on inital time
        triggerOnStart: function () {
            // Trigger dot indicator if its enable 
            if (this.options.dot_indicator && this.options.dots) {
                const currentActiveDot = this.$dotContainer.find('li.active');
                this.animateDotIndicator(currentActiveDot, 'start')
            }
        },

        /**
         * On browswer close or tab change 
         * Remove plugin instance completely
         */
        destroy: function () {
            this.unbindEvents();
            this.$element.removeData(this._name);
        },

        //navigate through items
        navigate: function (direction) {
            const jsSlider = this
            if (jsSlider.isAnimating === false) {
                direction === 'next' ? jsSlider.Next() : jsSlider.Prev()
                //Call jsSlider
                jsSlider.checkCallBackMethod.call(jsSlider)
            }
        },

        // Cache DOM nodes for performance
        buildCache: function () {
            this.$element = $(this.element);
        },

        // Unbind events that trigger methods
        unbindEvents: function () {
            /*
                Unbind all events in our plugin's namespace that are attached
                to "this.$element".
            */
            this.$element.off('.' + this._name);
        },

        /**
         * Create necessary html object for slider 
         * Definetly check user settings and create object based on it
         */
        createHtmlDom: function () {

            if(this.$element.find('.block-editor-block-list__layout').length > 0 ){
                // console.log("editor inner",this.$element.find('.block-editor-block-list__layout'));
                this.$outerStage = this.$element.find(".block-editor-block-list__layout")[0]
                this.$outerStage = $(this.$outerStage)
            }
            if (this.$element.find(".qubely-slider-outer-stage").length > 0) {
                // this.$outerStage = this.$element.find(".qubely-slider-outer-stage")
            }

            if (this.$element.find(".qubely-slider-list").length > 0) {
                this.$sliderList = this.$element.find(".qubely-slider-list")
            }

            // qubely-slider-list
            // Do calculate total items and clone numbers
            this.itemProfessor()


            // Create dots element if dots setting enable
            if (this.options.dots) {
                if(this.$element.find('.qubely-slider-dots').length === 0 ){
                    this.createDotsController()
                }else{
                    this.$dotContainer = this.$element.find('.qubely-slider-dots ul');
                }
                
            }

            this.calculateItemCoordinate()
        },

        /**
         * Slider professor which calculate and mesure whole slider needs 
         * @elementWidth = Total slider width with margin 
         * @itemWidth = each item width 
         * @_clones = Need to clone number of items 
         * @_maxL = maximum length of items 
         * @_minL = minimum length of items
         */
        itemProfessor: function () {
            const cloneItems = this.$element.find('.clone').length
            this._numberOfItems = this.$element.find('.qubely-slider-item').length - cloneItems
            let viewPort = null
            if (typeof this.options.responsive !== 'undefined')
                viewPort = this.parseResponsiveViewPort()

            this.options.items = viewPort === null ? this.options.items : typeof viewPort.items === 'undefined' ? this.options.items : viewPort.items
            this.elementWidth = this.$element.outerWidth() + this.options.margin
            this.itemWidth = Math.abs(this.elementWidth / this.options.items).toFixed(5)
            this.itemWidth = parseFloat(this.itemWidth)
            this._clones = 1; //this._numberOfItems > this.options.items ? Math.ceil(this._numberOfItems / 2) : this.options.items
            const parcialItems = this.options.items >= this._numberOfItems ? 0 : this._numberOfItems - this.options.items
            // this._maxL = this.itemWidth * ( (this._numberOfItems -1) + (this._clones - 1))
            this._maxL = this.itemWidth * parcialItems
            this._maxL = parseFloat((this._maxL).toFixed(5))
            // this._minL = this.options.center === false ? this.itemWidth : (this.itemWidth * this._clones) - (this.itemWidth / 2)
            this._minL = this.options.center === false ? 0 : (this.itemWidth * this._clones) - (this.itemWidth / 2)
            this._minL = parseFloat((this._minL).toFixed(5))
            // console.log("max: ", this._maxL, ' min: ', this._minL )
        },


        // Append before item
        appendBefore: function (clones) {
            clones.map((item) => { this.$outerStage.prepend(item); })
        },

        // Append after item
        appendAfter: function (clones) {
            clones.map((item) => { this.$outerStage.append(item); })
        },

        /**
         * Find each children width and do parallal sum operation and store in array
         */
        calculateItemCoordinate: function () {
            let jsSlider = this
            let child_ = this.$outerStage.children()
            child_.each(function (i, obj) {
                jsSlider._itemCoordinate.push((i + 1) * jsSlider.itemWidth)
            })
        },

        /**
         * Add dots navigation
         * @options.dots = true 
         */
        createDotsController: function () {
            //Create dots navigation
            let dotBox = document.createElement('div')
            dotBox.setAttribute('class', 'qubely-slider-dots')
            this.$element.append(dotBox)
            let jsSlider = this;
            let dotContainer = document.createElement('ul')
            let viewPort = null
            if (typeof this.options.responsive !== 'undefined')
                viewPort = this.parseResponsiveViewPort()
            let items = viewPort === null ? this.options.items : typeof viewPort.items === 'undefined' ? this.options.items : viewPort.items
            let dotLength = Math.floor(this._numberOfItems / items)
            if (dotLength > 1) {
                for (var i = 0; i < dotLength; i++) {
                    let dotItem = document.createElement('li')
                    dotItem.setAttribute('class', 'js-dot-' + i)
                    $(dotItem).css({ '-webkit-transition': 'all 0.5s linear 0s' })
                    if (i === 0) {
                        $(dotItem).addClass('active')
                    }

                    // Dot indicator                        
                    if (jsSlider.options.dot_indicator) {
                        let dotIndicator = document.createElement('span')
                        dotIndicator.setAttribute('class', 'dot-indicator')
                        dotItem.append(dotIndicator)
                    }
                    dotContainer.append(dotItem)
                }
            }
            dotBox.append(dotContainer)
            this.$element.append(dotBox)
            //Cache dot container
            this.$dotContainer = $(dotContainer)
        },



        /**
         * Apply base css property on initial hook 
         */
        applyBasicStyle: function () {
            let totalItems = 0;
            let cssPropety = {}
            cssPropety.width = this.itemWidth - (this.options.margin) + 'px'
            if (this.options.margin > 0) {
                cssPropety.marginRight = this.options.margin + 'px'
            }

            this.$element.find('.qubely-slider-item').each(function () {
                totalItems++;
                $(this).css(cssPropety)
            })
            this._currentPosition = 0; //this.itemWidth //this._clones * this.itemWidth
            if (this.options.center === true) {
                this._currentPosition = this.itemWidth - (this.itemWidth / 2)
                this._currentPosition = parseFloat((this._currentPosition).toFixed(5))
            }
            this.$outerStage.css({
                '-webkit-transition-duration': '0s',
                '-webkit-transform': `translate3D(-${this._currentPosition}px,0px,0px)`,
                width: totalItems * this.itemWidth + 'px'
            })
            this._items = totalItems
            this.updateResponsiveView()
        },


        /**
         * Go next slider item 
         * @if next slider item is last item 
         * @then go first item 
         * It will be looping one after another item continusely if you continusely click next nav controller
         * 
         * Save the active item to the item object (globally)
         */
        Next: function () {
            // this.isAnimating = true
            if (this.delta === -1)
                this.delta = 1
            this.updateItemStyle()
        },

        /**
         * Go prevouse slider item 
         * @if prevouse slider item is first one then go to last slider 
         * It will be looping on thread if you continousely click prev icon
         * 
         * Save the active item to the item object (globally) 
         */
        Prev: function () {
            // this.isAnimating = true
            if (this.delta === 1)
                this.delta = -1
            this.updateItemStyle()
        },
        /**
         * Go exact slider position by index number
         * If you click on dots navication it will pick the index number of the dot controller
         * then search the slider index item and active that item 
         * 
         * Check also delta that will tell you where we should go (forword|backword)
         * 
         * Save the active item to the item object (globally)
         */
        slideFromPosition: function (position, delta) {
            // this.isAnimating = true
            let updatedPosition = this.itemWidth * (this.options.items * position)
            let newPosition = position === 0 ? this._minL : this._minL + updatedPosition
            this.$outerStage.css({
                '-webkit-transition': `all ${this.options.speed}ms ease 0s`,
                '-webkit-transform': `translate3D(-${newPosition}px,0px,0px)`,
            })
            this._currentPosition = newPosition
            /**
             * Detect am I click the next elment of active one or prev element
             * If prev element then slide from left otherwise from right
             */
            this.delta = delta
        },

        updateDotsFromPosition: function (position) {
            let prevActiveDot = this.$dotContainer.find('li.active').removeClass('active')
            let currentActiveDot = this.$dotContainer.find('li:nth-child(' + position + ')').addClass('active');

            if (this.options.dot_indicator) {
                this.animateDotIndicator(prevActiveDot, 'stop')
                if (this._dotControllerTimeId > 0) {
                    clearTimeout(this._dotControllerTimeId)
                    this._dotControllerTimeId = 0;
                }
                this._dotControllerTimeId = setTimeout(() => {
                    this.animateDotIndicator(currentActiveDot, 'start')
                }, this.options.speed)
            }
            currentActiveDot.css({ '-webkit-transition': 'all 0.5s linear 0s' })
        },

        /**
         * Check action 
         * If its start then get the speed between interval and slider speed 
         * Then set the transition duration
         * @param {DOM} dotItem 
         * @param {string} action 
         */
        animateDotIndicator: function (dotItem, action) {
            if (action === 'stop') {
                dotItem.find('.dot-indicator').removeClass('active').css({
                    '-webkit-transition-duration': '0s'
                })
            }
            if (action === 'start') {
                const speed = Math.abs(this.options.interval - this.options.speed);
                dotItem.find('.dot-indicator').addClass('active').css({
                    '-webkit-transition-duration': speed + 'ms',
                })
            }
        },

        /**
         * Update active and prevouse item style when change the slider 
         * 
         * Check if the new position gretter then Maximum length 
         * Then set the new position to minimum length 
         * 
         * Check if the new position gretter then Minimum length 
         * Then set the new psoition to maximum length
         * 
         * Update the @_currentPosition with new position
         */
        updateItemStyle: function () {
            
            if (this._timeoutId1 > 0) {
                clearTimeout(this._timeoutId1)
                this._timeoutId1 = 0;
            }
            let dragEndPointer = this.prevCoordinate.dragPointer === -1 ? 0 : this.prevCoordinate.dragPointer

            let currentPosition = this._currentPosition
            let thePosition = this.itemWidth + parseInt(dragEndPointer)
            
            let newPosition = this.delta === 1 ? currentPosition + thePosition : currentPosition - thePosition
                newPosition = parseFloat(newPosition.toFixed(5))
            if (newPosition > this._maxL) {
                this.$outerStage.css({
                    'transition': `0s`,
                    '-webkit-transform': `translate3D(-${this.itemWidth}px,0px,0px)`,
                })
                newPosition = this._minL; // - this.itemWidth
            }
            if (currentPosition < this._minL) {
                this.$outerStage.css({
                    'transition': `0s`,
                    '-webkit-transform': `translate3D(-${this._maxL}px,0px,0px)`,
                })
                newPosition = parseFloat((this._maxL - this.itemWidth).toFixed(5))
            }

            this._timeoutId1 = setTimeout(() => {
                this.$outerStage.css({
                    '-webkit-transition': `all ${this.options.speed}ms ease 0s`,
                    '-webkit-transform': `translate3D(-${newPosition}px,0px,0px)`,
                })
            }, 0)

            this._currentPosition = newPosition
            this.processActivationWorker()
        },

        /**
         * Add / Remove active class from visible elements  
         * 
         */
        processActivationWorker: function () {
            let currentStagePosition = this._currentPosition
            let startIndex = Math.floor(currentStagePosition / this.itemWidth)
            let endIndex = Math.floor(Math.abs(this.options.items + startIndex))
            this.$outerStage.find('.active').removeClass('active')
            for (let i = startIndex; i < endIndex; i++) {
                this.$outerStage.children(':eq(' + i + ')').addClass('active')
            }
            let reminder = Math.floor(((startIndex - this._clones) / this.options.items)) + 1
            if (this.options.dots) {
                this.$dotContainer.find('.active').removeClass('active')
                this.$dotContainer.find('li:nth-child(' + reminder + ')').addClass('active')
            }
        },

        /**
         * Reset coordination operation
         * When start dragging save some mouse coordinate for calculate the position 
         * So when release the drag it will reset the config to inital setting
         * 
         * Also check if some item already change the opacity on drag operation
         */
        resetCoordiante: function () {
            this.prevCoordinate = { x: 0, y: 0, diff: 0, dragPointer: -1 };
            this.coordinate = { x: 0, y: 0 }
        },

        /**
         * Back to stage if not drag enough to satisfy condition
         */
        backToStage: function () {

        },
        // Bind events that trigger methods
        bindEvents: function () {
            const jsSlider = this;


            if (jsSlider.options.dots) {
                jsSlider.$dotContainer.find('li').each(function (index) {
                    $(this).on('click' + '.' + jsSlider._name, function (e) {
                        if ($(this).hasClass('active') || jsSlider.isAnimating === true)
                            return false

                        let activeDotNav = $(this).parent().find('li.active')
                        let activeIndex = jsSlider.$dotContainer.find('li').index(activeDotNav)
                        let delta = activeIndex > index ? -1 : 1
                        jsSlider.slideFromPosition(index, delta)
                        jsSlider.updateDotsFromPosition(index + 1)

                        //Call jsSlider
                        jsSlider.checkCallBackMethod.call(jsSlider)
                    })
                })
            }

            $(window).on('resize' + '.' + jsSlider._name, $.proxy(jsSlider.windowResize, jsSlider))

        },

        windowResize: function (e) {
            if (typeof e === 'undefined')
                return;
            this.updateResponsiveView()
        },
        parseResponsiveViewPort: function () {
            let responsiveProps = this.options.responsive
            if (typeof responsiveProps === 'undefined')
                return
            let activeView = null
            let wWidth = window.innerWidth
            for (let i = 0; i < responsiveProps.length; i++) {
                if (wWidth > responsiveProps[i].viewport) {
                    activeView = responsiveProps[i]
                    break;
                }
            }
            if (activeView === null) {
                activeView = responsiveProps[responsiveProps.length - 1]
            }
            return activeView
        },
        updateResponsiveView: function () {
            if (typeof this.options.responsive === 'undefined')
                return
            let jsSlider = this
            let wHeight = window.innerHeight
            let viewPort = jsSlider.parseResponsiveViewPort()

            if (viewPort.height === 'full') {
                if (this._lastViewPort === wHeight)
                    return
                this._lastViewPort = wHeight
                this.$outerStage.css({ height: wHeight + 'px' })
            } else {
                if (this._lastViewPort === viewPort.height)
                    return
                this._lastViewPort = viewPort.height
                this.$outerStage.css({ height: viewPort.height })
            }

        },
        /**
         * Get mouse position
         * @on touch device 
         * @on destkop
         */
        getPosition: function (event) {
            let result = { x: null, y: null }
            event = event.originalEvent || event || window.event;
            event = event.touches && event.touches.length ?
                event.touches[0] : event.changedTouches && event.changedTouches.length ?
                    event.changedTouches[0] : event;

            if (event.pageX) {
                result.x = event.pageX;
                result.y = event.pageY;
            } else {
                result.x = event.clientX;
                result.y = event.clientY;
            }
            return result;
        },
     

        /**
         * Check if it has callback function 
         * If has then fire callback function
         */
        checkCallBackMethod: function () {
            this.callback()
        },

        /**
         * Fire callback function with current item 
         */
        callback: function () {
            let onChange = this.options.onChange
            if (typeof onChange === 'function') {
                const items = this.$element.find('.qubely-slider-item').length
                let option = { item: this.item, items: items, element: this.$element }
                onChange.call(this.element, option)
            }
        }

    });

    /**
     * Initiate the js-coursel plugin 
     */
    $.fn.jsSlider = function (options) {
        this.each(function () {
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName, new Plugin(this, options));
            }
        });
        return this;
    };

    /**
     * Default setting for intire slide operation
     */
    $.fn.jsSlider.defaults = {

        // Number of item need to show
        items: 4,

        // Autoplay trigger
        autoplay: false,

        // Is item mode center
        center: false,

        // Margin between items 
        margin: 10,

        // Slide speed 
        speed: 800,

        // Slider interval 
        interval: 4500,

        // callback function in each onChnage event
        onChange: null,

        // Enable/Disable dots indicator
        dots: true,

        // Set inner span to each dot indicator
        dot_indicator: false,

        //Enable/Disable navigation
        nav: true,

    };

})( jQuery, window, document );