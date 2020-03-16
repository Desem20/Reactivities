import { IActivity } from './../models/activity';
import {observable,action,computed,configure, runInAction} from 'mobx';
import { createContext,SyntheticEvent} from 'react';
import agent from '../api/agent';

configure({enforceActions:'always'});

class ActivityStore {
  @observable activityResitry = new Map();
  @observable activities: IActivity[] = [];
  @observable selectedActivity: IActivity|undefined;
  @observable loadingInitial = false;
  @observable editMode = false;
  @observable submitting = false;
  @observable target = '';

  @computed get activitiesByDate(){
    return Array.from(this.activityResitry.values())
    .sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
  }

  @action loadActivities =async () =>{
    this.loadingInitial = true;
    try{
      const activities = await agent.Activities.list();
      runInAction('load activities',()=>{
        activities.forEach(activity => {
          activity.date = activity.date.split('.')[0];
          this.activityResitry.set(activity.id,activity);
        });
        this.loadingInitial= false
      })    
    }catch(error){
      runInAction('load activities error',()=>{
        console.log(error);
        this.loadingInitial= false;
      }); 
    }
  }

  @action createActivity = async (activity:IActivity)=>{
    this.submitting = true;
    try{
      await agent.Activities.create(activity)
      runInAction('creating activity',()=>{
        this.activityResitry.set(activity.id,activity);
        //this.selectedActivity = activity;
        this.editMode = false;
        this.submitting = false;
      })
      
    }catch(error){
      runInAction('create activity error',()=>{
        this.submitting = false;
      })    
      console.log(error);
    }
  }

  @action editActivity = async (activity:IActivity)=>{
    this.submitting = true;
    try{
      await agent.Activities.update(activity);
      runInAction('editing activity ',()=>{
        this.activityResitry.set(activity.id,activity);
        this.selectedActivity = activity;
        this.editMode = false;
        this.submitting = false;
      })    
      
    }catch(error){
      runInAction('edit activity error',()=>{
        this.submitting = false;
      }) 
      console.log(error);
    }
  }

  @action deleteActivity = async (event:SyntheticEvent<HTMLButtonElement>,id:string)=>{
    this.submitting = true;
    try{
      this.target = event.currentTarget.name;
      await agent.Activities.delete(id);
      runInAction('deleting activity error',()=>{
        this.activityResitry.delete(id);      
        this.submitting = false;
        this.target = '';
      }) 
     
    }catch(error){
      runInAction('delete activity error',()=>{
        this.submitting = false;
        this.target = '';
      }) 
      console.log(error);
    }
  }

  @action OpenCreateForm = async ()=>{
    this.editMode = true;
    this.selectedActivity = undefined;
  }
  @action openEditForm = async (id:string)=>{
    this.selectedActivity = this.activityResitry.get(id);
    this.editMode = true;
  }

  @action cancelSelectedActivity = ()=>{
    this.selectedActivity = undefined;
  }

  @action cancelFormOpen = async ()=>{
    this.editMode = false;
  }
  @action selectActivity = (id:string) =>{
    this.selectedActivity = this.activityResitry.get(id);
    this.editMode = false;
  }

}

export default createContext(new ActivityStore());