// Project Type
enum ProjectStatus { Active, Finished }
class Project {
    constructor( 
        public id: string, 
        public title: string, 
        public description: string, 
        public people: number, 
        public status: ProjectStatus )
        {}
}

// Project State Management

type Listener = (items: Project[]) => void;

class ProjectState {
    private projects : Project[] = [];
    private listeners: Listener[] = [];
    private static instance: ProjectState;

    private constructor() {

    }

    static getInstance() {
        if(this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance
    }
    addListeners(listenersFn: Listener){
        this.listeners.push(listenersFn)
    }

    addProject(title: string, description: string, numbOfPeople: number){
        const newProject = new Project(Math.random().toString(), title, description, numbOfPeople, ProjectStatus.Active)
        this.projects.push(newProject);
        for(const listenersFn of this.listeners){
            listenersFn(this.projects.slice())
        }
    }
}

const projectState = ProjectState.getInstance() ;

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

//Project List Class
class ProjectList {
    templateElement: HTMLTemplateElement;
    hostElement: HTMLDivElement;
    element: HTMLElement;
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished'){
        this.templateElement = document.getElementById(
            "project-list"
          )! as HTMLTemplateElement;
          this.hostElement = document.getElementById("app")! as HTMLDivElement;
          this.assignedProjects = [];
      
          const importedNode = document.importNode(
            this.templateElement.content,
            true
          );
      
          this.element = importedNode.firstElementChild as HTMLFormElement;
          this.element.id = `${this.type}-projects`;

          projectState.addListeners((projects: Project[]) => {
            const relevantProjects = projects.filter( prj => {
                if(this.type === 'active'){
                    return prj.status === ProjectStatus.Active;
                }
                return prj.status === ProjectStatus.Finished;
            })
            this.assignedProjects = relevantProjects;
            this.renderProjects();
          })

          this.attach();
          this.renderContent();
    }

    private renderProjects () {
        const listElement = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement;

        listElement.innerHTML = '';
        for (const prjItem  of this.assignedProjects){
            const listItem = document.createElement('li');
            listItem.textContent= prjItem.title;
            listElement?.appendChild(listItem);
        }
    }
    private renderContent(){
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }
    private attach () {
        this.hostElement.insertAdjacentElement('beforeend', this.element)
    }
}

//ProjectInput class
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
        projectState.addProject(title, description, people);
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
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished')
