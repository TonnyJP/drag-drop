// Drag & drop interfaces
interface Draggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}

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
type Listener<T> = (items: T[]) => void;

class State<T>{
    protected listeners: Listener<T>[] = [];

    addListeners(listenersFn: Listener<T>){
        this.listeners.push(listenersFn)
    }
}

class ProjectState extends State<Project> {
    private projects : Project[] = [];
    
    private static instance: ProjectState;

    private constructor() {
        super()
    }

    static getInstance() {
        if(this.instance) {
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance
    }

    addProject(title: string, description: string, numbOfPeople: number){
        const newProject = new Project(Math.random().toString(), title, description, numbOfPeople, ProjectStatus.Active)
        this.projects.push(newProject);
        this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus) {
       const project =  this.projects.find(prj => prj.id === projectId);
       if( project && project.status !== newStatus) {
          project.status = newStatus;
          this.updateListeners();
       }
    }

    private updateListeners () {
        for(const listenersFn of this.listeners){
            listenersFn(this.projects.slice());
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

//Component Base Class
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string){
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostElementId)! as T;
        const importedNode = document.importNode(
            this.templateElement.content,
            true
          );
      
          this.element = importedNode.firstElementChild as U;
          if(newElementId){
            this.element.id = newElementId;
          }

          this.attach(insertAtStart)
    }

    private attach (insertAtBeginning: boolean) {
        this.hostElement.insertAdjacentElement(insertAtBeginning? 'afterbegin': 'beforeend', this.element)
    }

    abstract configure(): void;
    abstract renderContent(): void;
}

// ProjectItem Class
class ProjectItem extends Component<HTMLUListElement, HTMLElement> implements Draggable{
    private project: Project;

    get persons() {
        return this.project.people === 1? `1 person` : `${this.project.people} persons`;
    }

    constructor(hostId: string, project: Project){
        super('single-project', hostId, false, project.id);
        this.project = project;
        this.configure();
        this.renderContent();
    }

    @autobind
    dragStartHandler(event: DragEvent): void {
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
    }

    dragEndHandler(_event: DragEvent): void {
        console.log("Dragend");
        //throw new Error("Method not implemented.");
    }

    configure(){
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler)
    }

    renderContent(): void {
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }
}

// Project List Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget{

    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished'){
        super("project-list", "app", false ,`${type}-projects`);

        this.assignedProjects = [];

        this.configure();
        this.renderContent();
    }

    @autobind
    dragOverHandler(event: DragEvent): void {
        if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
            event.preventDefault();
            this.element.querySelector('ul')!.classList.add('droppable')
        }
    }

    @autobind
    dropHandler(event: DragEvent): void {
        projectState.moveProject(event.dataTransfer!.getData('text/plain'), this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished)
    }

    @autobind
    dragLeaveHandler(_event: DragEvent): void {
        this.element.querySelector('ul')!.classList.remove('droppable')
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

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

          this.renderContent();
    }

    renderContent(){
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS';
    }

    private renderProjects () {
        const listElement = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement;

        listElement.innerHTML = '';
        for (const prjItem  of this.assignedProjects){
           new ProjectItem(this.element.querySelector('ul')!.id, prjItem)
        }
    }
}

//ProjectInput class
class ProjectInput extends Component<HTMLDivElement, HTMLElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

  constructor() {
    super("project-input", "app", true, 'user-input');
    this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector('#description')! as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector('#people')! as HTMLInputElement;
    
    this.configure();
  }

  configure () {
    this.element.addEventListener('submit', this.submitHandler.bind(this))
  }

  renderContent(): void {
      
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
}

const prjInput = new ProjectInput();
const activeProjectList = new ProjectList('active');
const finishedProjectList = new ProjectList('finished')
