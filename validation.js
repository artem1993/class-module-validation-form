class FormsValidation {
    selectors = {
        form: "[data-js-form]", // форма
        fieldErrors: "[data-js-form-field-errors]", // ошибки
    }

    errorMessages = {
        // ошибки храним в виде анонимных ф-ций, а не в строках
        // чтобы добавить больше информативности
        valueMissing: () => "Заполните это поле",
        patternMismatch: ({title}) => title || "Неверный формат",
        tooShort: ({minLength}) => `Слишком короткое значение, минимум символов — ${minLength}`,
        tooLong: ({maxLength}) => `Слишком длинное значение, максимум символов — ${maxLength}`,
    }

    constructor() {
        this.bindEvents()
    }

    manageErrors(fieldControlElement, errorMessages) {
        // получаем p.field, и уже от него ищем [data-js-form-field-errors]
        const fieldErrorsElement = fieldControlElement.parentElement.querySelector(this.selectors.fieldErrors)

        fieldErrorsElement.innerHTML = errorMessages
        .map(message => `<span class="field-error">${message}</span>`)
        .join("")
    }

    // валидация полей
    validateField(fieldControlElement) {
        // получаем объект с полями ошибок target элемента
        const errors = fieldControlElement.validity

        // сюда будем складывать сообщения ошибок
        const errorMessages = []

        // преобразуем объект в массив пар ['ключ', 'значение']
        // Ex: ["valueMissing", () => "Заполните это поле"]
        Object.entries(this.errorMessages).forEach(([errorType, getErrorMessage]) => {
            // если св-во по определенному имени с типом ошибки = true
            if (errors[errorType]) {
                errorMessages.push(getErrorMessage(fieldControlElement))
            }
        })

        // отображение ошибок
        this.manageErrors(fieldControlElement, errorMessages)

        // поле будет считаться валидным
        // если errorMessages будет пуст
        const isValid = errorMessages.length === 0

        // для пользователей скринридеров подсказываем
        // что они вводят что-то не так
        // Поле считается невалидным если есть хотя бы одна ошибка,
        // то есть если errorMessages не пустой
        fieldControlElement.ariaInvalid = !isValid

        // если все валидны
        return isValid
    }

    // валидация поля когда с него уходит фокус (blur)
    onBlur(event) {
        // получаем событие
        const {target} = event
        // проверяем что поле обязательно
        const isRequired = target.required
        // проверяем что событие возникло на элементе внутри формы,
        // где есть data-js-form
        const isFormField = target.closest(this.selectors.form)

        // проверяем что перед нами элементы формы и поля обязательны
        if (isFormField && isRequired) {
            this.validateField(target) // валидация поля
        }
    }

    onChange(event) {
        // получаем событие
        const {target} = event
        // проверяем что поле обязательно
        const isRequired = target.required
        // если radio или checkbox, то true
        const isToggleType = ["radio", "checkbox"].includes(target.type)

        if (isToggleType && isRequired) {
            this.validateField(target) // валидация поля
        }
    }

    onSubmit(event) {
        // проверяем что у формы есть data-js-form
        const isFormElement = event.target.matches(this.selectors.form)

        // если форма не имеет data-js-form
        // не делаем кастомную валидацию и выходим из ф-ции
        if (!isFormElement) return

        // получаем все обязательные поля формы
        const requiredControlElements = [...event.target.elements].filter(({required}) => required)

        // изначально поле валидно
        let isFormValid = true
        // первое невалидное поле
        let firstInvalidFieldControl = null

        requiredControlElements.forEach(element => {
            // валидация поля: true или false
            const isFieldValid = this.validateField(element)

            // если поле невалидно
            if (!isFieldValid) {
                isFormValid = false

                // если firstInvalidFieldControl !== null
                // ссылаемся на первое невалидное поле
                if (!firstInvalidFieldControl) {
                    firstInvalidFieldControl = element
                }
            }
        })

        // если форма не валидна отменяем отправку
        // и ставим фокус на первое невалидное поле
        if (!isFormValid) {
            event.preventDefault()
            firstInvalidFieldControl.focus()
        }
    }

    // привязываем ко всему document события blur, change, submit
    bindEvents() {
        //! blur не всплывает наверх с целевого элемента
        //! у него отсутствует фаза всплытия
        //! мы отлавливаем событие на этапе погружения, добавив
        //! либо {capture: true} либо true в конец
        document.addEventListener("blur", e => this.onBlur(e), true)

        // чтобы нам не мешал фокус (blur)
        // и при очередной попытке заполнения пропадали ошибки
        document.addEventListener("change", e => this.onChange(e))

        // обработка отправки формы
        document.addEventListener("submit", e => this.onSubmit(e))
    }
}

new FormsValidation()
