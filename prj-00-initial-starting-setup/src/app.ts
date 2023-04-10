//validation
interface ValidationData{
value: string | number;
required?: boolean;
minLength?: number;
maxLength?: number;
min?: number;
max?: number;
}

function validate(validationData: ValidationData){
    let isValid = true;
    
    if(validationData.required){
        isValid && validationData.value.toString().trim().length !== 0;
    }
    if(validationData.minLength && typeof validationData.value === 'string'){
        isValid = isValid && validationData.value.length >= validationData.minLength
    }
    if(validationData.maxLength && typeof validationData.value === 'string'){
        isValid = isValid && validationData.value.length <= validationData.maxLength
    }
    if(validationData.min != null && typeof validationData.value === 'number'){
        isValid = isValid && validationData.value >= validationData.min
    }
    if(validationData.max != null && typeof validationData.value === 'number'){
        isValid = isValid && validationData.value <= validationData.max;
    }
    
    return isValid;
}

//autobind-decorator
function autobind(_target: any, _mehtodName: string, descriptor: PropertyDescriptor){
    const originalMethod = descriptor.value;
    const adjDescriptor: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    };

    return adjDescriptor
}


class ProjectInput {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      "project-input"
    )! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = 'user-input';
    this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector('#description')! as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector('#people')! as HTMLInputElement;

    this.configure();
    this.attach();
  }

  private gatherUserInput = (): [string, string, number] | void => {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidationData: ValidationData = {
        value: enteredTitle,
        required: true
    }
    const descriptionValidationData: ValidationData = {
        value: enteredDescription,
        required: true,
        minLength: 5
    }
    const peopleValidationData: ValidationData = {
        value: +enteredPeople,
        required: true,
        min: 1,
        max: 5,
    }

    if(!validate(titleValidationData) || !validate(descriptionValidationData) || !validate(peopleValidationData)){
        alert('Invalid input, pleaser try again!');
        return;
    }
    return [enteredDescription, enteredTitle, +enteredPeople]   
  }

  private clearInput = () => {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  @autobind
  private submitHandler (event: Event ) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if(Array.isArray(userInput)){
        const [ title, description, people ] = userInput;
        console.log(title, description, people);
        this.clearInput();
    }
  }

  private configure () {
    this.element.addEventListener('submit', this.submitHandler.bind(this))
  }

  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
    console.log(this.element);
  }
}

const prjInput = new ProjectInput();
