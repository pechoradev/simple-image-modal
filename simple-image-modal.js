/**
 * Simple Image Modal - Легкая библиотека для открытия изображений в модальном окне
 * @module SimpleImageModal
 * @author Pechora-Dev
 * @site-author https://pechora-dev.ru
 * @version 1.0.0
 * @license MIT
 */

/**
 * Класс для создания модального окна с изображением
 * @class
 * @classdesc Позволяет открывать изображения в модальном окне с поддержкой зума и навигации
 */
class SimpleImageModal {
    /**
     * Создает экземпляр модального окна
     * @constructor
     * @param {Object} options - Опции конфигурации
     * @param {string} [options.selector='img'] - CSS селектор для изображений
     * @param {string|null} [options.excludeSelector=null] - CSS селектор для исключения изображений
     * @param {string} [options.modalClass='simple-image-modal'] - Класс для модального окна
     * @param {string} [options.modalContentClass='simple-image-modal-content'] - Класс для контента
     * @param {string} [options.closeButtonClass='simple-image-modal-close'] - Класс для кнопки закрытия
     * @param {string} [options.captionClass='simple-image-modal-caption'] - Класс для подписи
     * @param {number} [options.animationDuration=300] - Длительность анимации в мс
     * @param {boolean} [options.closeOnClick=true] - Закрытие по клику на фон
     * @param {boolean} [options.closeOnEsc=true] - Закрытие по клавише ESC
     * @param {boolean} [options.showCaption=true] - Показывать подпись (alt или title)
     * @param {boolean} [options.enableZoom=true] - Включить возможность зума
     * @param {number} [options.maxZoom=3] - Максимальный коэффициент увеличения
     * @example
     * const modal = new SimpleImageModal({
     *     selector: '.gallery-img',
     *     enableZoom: true,
     *     maxZoom: 4
     * });
     */
    constructor(options = {}) {
        /**
         * Объединенные опции с значениями по умолчанию
         * @private
         * @type {Object}
         */
        this.options = {
            selector: 'img',
            excludeSelector: null,
            modalClass: 'simple-image-modal',
            modalContentClass: 'simple-image-modal-content',
            closeButtonClass: 'simple-image-modal-close',
            captionClass: 'simple-image-modal-caption',
            animationDuration: 300,
            closeOnClick: true,
            closeOnEsc: true,
            showCaption: true,
            enableZoom: true,
            maxZoom: 3,
            ...options
        };

        /** @private @type {HTMLElement|null} */
        this.modal = null;
        
        /** @private @type {HTMLImageElement|null} */
        this.modalImg = null;
        
        /** @private @type {HTMLElement|null} */
        this.modalCaption = null;
        
        /** @private @type {HTMLImageElement|null} */
        this.currentImage = null;
        
        /** @private @type {number} */
        this.scale = 1;
        
        /** @private @type {boolean} */
        this.isDragging = false;
        
        /** @private @type {number} */
        this.startX = 0;
        
        /** @private @type {number} */
        this.startY = 0;
        
        /** @private @type {number} */
        this.translateX = 0;
        
        /** @private @type {number} */
        this.translateY = 0;

        this.init();
    }

    /**
     * Инициализирует модальное окно
     * @private
     * @returns {void}
     */
    init() {
        this.createModal();
        this.bindEvents();
    }

    /**
     * Создает DOM-элементы модального окна
     * @private
     * @returns {void}
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = this.options.modalClass;
        this.modal.style.cssText = `
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            opacity: 0;
            transition: opacity ${this.options.animationDuration}ms ease;
            cursor: pointer;
        `;

        const modalContent = document.createElement('div');
        modalContent.className = this.options.modalContentClass;
        modalContent.style.cssText = `
            position: relative;
            margin: auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 90%;
            height: 90%;
        `;

        this.modalImg = document.createElement('img');
        this.modalImg.style.cssText = `
            max-width: 100%;
            max-height: calc(100% - 60px);
            object-fit: contain;
            user-select: none;
            transition: transform ${this.options.animationDuration}ms ease;
            cursor: ${this.options.enableZoom ? 'grab' : 'pointer'};
        `;

        const closeBtn = document.createElement('span');
        closeBtn.className = this.options.closeButtonClass;
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 35px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            transition: 0.3s;
            z-index: 10000;
        `;
        closeBtn.onmouseover = () => closeBtn.style.color = '#bbb';
        closeBtn.onmouseout = () => closeBtn.style.color = '#f1f1f1';

        this.modalCaption = document.createElement('div');
        this.modalCaption.className = this.options.captionClass;
        this.modalCaption.style.cssText = `
            margin: 15px auto;
            color: #fff;
            text-align: center;
            font-size: 16px;
            max-width: 80%;
        `;

        modalContent.appendChild(this.modalImg);
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(this.modalCaption);
        this.modal.appendChild(modalContent);
        document.body.appendChild(this.modal);

        /** @private @type {HTMLElement} */
        this.closeBtn = closeBtn;
        
        /** @private @type {HTMLElement} */
        this.modalContent = modalContent;
    }

    /**
     * Привязывает обработчики событий
     * @private
     * @returns {void}
     */
    bindEvents() {
        document.addEventListener('click', (e) => {
            const img = e.target.closest(this.options.selector);
            if (img && !this.isExcluded(img)) {
                e.preventDefault();
                this.open(img);
            }
        });

        if (this.options.closeOnClick) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        this.closeBtn.addEventListener('click', () => this.close());

        if (this.options.closeOnEsc) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen()) {
                    this.close();
                }
            });
        }

        if (this.options.enableZoom) {
            this.modalImg.addEventListener('wheel', (e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                this.zoom(delta);
            });

            this.modalImg.addEventListener('mousedown', (e) => {
                if (this.scale > 1) {
                    this.isDragging = true;
                    this.startX = e.clientX - this.translateX;
                    this.startY = e.clientY - this.translateY;
                    this.modalImg.style.cursor = 'grabbing';
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (this.isDragging && this.scale > 1) {
                    this.translateX = e.clientX - this.startX;
                    this.translateY = e.clientY - this.startY;
                    this.updateImageTransform();
                }
            });

            document.addEventListener('mouseup', () => {
                if (this.isDragging) {
                    this.isDragging = false;
                    this.modalImg.style.cursor = 'grab';
                }
            });

            this.modalImg.addEventListener('dblclick', () => {
                this.resetZoom();
            });
        }
    }

    /**
     * Проверяет, исключено ли изображение из обработки
     * @private
     * @param {HTMLImageElement} img - Элемент изображения для проверки
     * @returns {boolean} true если изображение исключено
     */
    isExcluded(img) {
        if (!this.options.excludeSelector) return false;
        return img.matches(this.options.excludeSelector);
    }

    /**
     * Открывает модальное окно с указанным изображением
     * @public
     * @param {HTMLImageElement} img - Элемент изображения для отображения
     * @returns {void}
     * @example
     * const img = document.querySelector('img');
     * modal.open(img);
     */
    open(img) {
        this.currentImage = img;
        this.modalImg.src = img.src;
        
        if (this.options.showCaption) {
            const caption = img.getAttribute('alt') || img.getAttribute('title') || '';
            this.modalCaption.textContent = caption;
            this.modalCaption.style.display = caption ? 'block' : 'none';
        }

        this.modal.style.display = 'flex';
        
        setTimeout(() => {
            this.modal.style.opacity = '1';
        }, 10);

        document.body.style.overflow = 'hidden';
    }

    /**
     * Закрывает модальное окно
     * @public
     * @returns {void}
     * @example
     * modal.close();
     */
    close() {
        this.modal.style.opacity = '0';
        
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            this.resetZoom();
        }, this.options.animationDuration);
    }

    /**
     * Проверяет, открыто ли модальное окно
     * @public
     * @returns {boolean} true если модальное окно открыто
     * @example
     * if (modal.isOpen()) {
     *     console.log('Модальное окно открыто');
     * }
     */
    isOpen() {
        return this.modal.style.display === 'flex';
    }

    /**
     * Изменяет масштаб изображения
     * @private
     * @param {number} delta - Изменение масштаба (положительное для увеличения)
     * @returns {void}
     */
    zoom(delta) {
        if (!this.options.enableZoom) return;
        
        this.scale = Math.min(this.options.maxZoom, Math.max(1, this.scale + delta));
        
        if (this.scale === 1) {
            this.translateX = 0;
            this.translateY = 0;
        }
        
        this.updateImageTransform();
    }

    /**
     * Сбрасывает масштаб изображения к исходному
     * @public
     * @returns {void}
     * @example
     * modal.resetZoom();
     */
    resetZoom() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateImageTransform();
    }

    /**
     * Обновляет трансформацию изображения
     * @private
     * @returns {void}
     */
    updateImageTransform() {
        this.modalImg.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }

    /**
     * Обновляет опции модального окна
     * @public
     * @param {Object} options - Новые опции
     * @returns {void}
     * @example
     * modal.updateOptions({
     *     enableZoom: false,
     *     maxZoom: 2
     * });
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Уничтожает экземпляр модального окна и удаляет его из DOM
     * @public
     * @returns {void}
     * @example
     * modal.destroy();
     */
    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
        document.body.style.overflow = '';
    }
}

// Экспорт для различных сред
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleImageModal;
} else if (typeof define === 'function' && define.amd) {
    define([], function() {
        return SimpleImageModal;
    });
} else {
    window.SimpleImageModal = SimpleImageModal;
}