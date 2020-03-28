import { setActivityProps, createAttende } from './../common/util/util';
import { RootStore } from './rootStore';
import { history } from '../../';
import { IActivity } from './../models/activity';
import {observable,action,computed,runInAction} from 'mobx';
import {SyntheticEvent} from 'react';
import agent from '../api/agent';
import { toast } from 'react-toastify';
import {HubConnection, HubConnectionBuilder, LogLevel} from '@aspnet/signalr';


export default class ActivityStore {
  rootStore :RootStore;
  constructor(rootStore:RootStore){
    this.rootStore = rootStore;
  }
  @observable activityResitry = new Map();
  @observable activity: IActivity|null = null;
  @observable loadingInitial = false;
  @observable submitting = false;
  @observable target = '';
  @observable loading= false;
  @observable.ref hubConnection:HubConnection | null = null;

  @action createHubConnection = ()=>{
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`http://localhost:5000/chat`,{
        accessTokenFactory:()=>this.rootStore.commonStore.token!
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.start().then(()=>console.log(this.hubConnection!.state))
    .catch(error=>{
      console.log('Error connection',error);
    })

    this.hubConnection.on('ReciveComment',comment=>{
      runInAction(()=>{
        this.activity!.comments.push(comment);
      })     
    })
  }
  @action stopHubConnection = ()=>{
    this.hubConnection!.stop();
  }

  @action addComment = async (values:any)=>{
    values.activityId = this.activity!.id;
    try{
      await this.hubConnection!.invoke('SendComment',values)
    }catch(error){
      console.log(error);
    }

  }

  @computed get activitiesByDate(){
    return  this.groupActivitiesByDate(Array.from(this.activityResitry.values()))
  }

  groupActivitiesByDate(activities:IActivity[]){
    const sortedActivities = activities.sort(
      (a,b)=>a.date.getTime()- b.date.getTime()
    )
    return Object.entries(sortedActivities.reduce((activities,activity)=>{
      const date = activity.date.toISOString().split('T')[0];
      activities[date] = activities[date] ? [...activities[date],activity] : [activity];
      return activities;
    },{} as {[key:string]:IActivity[]}));
  }


  @action loadActivities =async () =>{
    this.loadingInitial = true;
    try{
      const activities = await agent.Activities.list();
      runInAction('load activities',()=>{
        activities.forEach(activity => {
          setActivityProps(activity,this.rootStore.userStore.user!);
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

  @action loadActivity =async (id:string) =>{
   let activity = this.getActivity(id);
   if(activity){
     this.activity = activity;
     return activity;
   }
   else{
    this.loadingInitial= true;
    try{
      activity = await agent.Activities.details(id);
      runInAction('getting activity',()=>{
        setActivityProps(activity,this.rootStore.userStore.user!);
        this.activity = activity;
        this.activityResitry.set(activity.id,activity);
        this.loadingInitial = false; 
      });
      return activity;
      
    }catch(error){
      runInAction('get activity error',()=>{
        this.loadingInitial = false; 
      });
      console.log(error);
    }
   }
  }

  @action clearActivity = ()=>{
    this.activity = null;
  }

  getActivity = (id:string)=>{
    return this.activityResitry.get(id);
  }

  @action createActivity = async (activity:IActivity)=>{
    this.submitting = true;
    try{
      await agent.Activities.create(activity);
      const attendee = createAttende(this.rootStore.userStore.user!);
      attendee.isHost = true;
      let attendees =[];
      attendees.push(attendee);
      activity.attendees = attendees;
      activity.comments = [];
      activity.isHost = true;
     
      runInAction('creating activity',()=>{
        this.activityResitry.set(activity.id,activity);
        //this.selectedActivity = activity;
        this.submitting = false;
      })
      history.push(`/activities/${activity.id}`)
    }catch(error){
      runInAction('create activity error',()=>{
        this.submitting = false;
      })    
      toast.error("Problem submitting data");
      console.log(error);
    }
  }

  @action editActivity = async (activity:IActivity)=>{
    this.submitting = true;
    try{
      await agent.Activities.update(activity);
      runInAction('editing activity ',()=>{
        this.activityResitry.set(activity.id,activity);
        this.activity = activity;
        this.submitting = false;
      })    
      history.push(`/activities/${activity.id}`)
    }catch(error){
      runInAction('edit activity error',()=>{
        this.submitting = false;
      }) 
      toast.error("Problem submitting data");
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
  @action attendActivity = async ()=>{
    const attendee = createAttende(this.rootStore.userStore.user!);
    this.loading = true;
    try{
      await agent.Activities.attend(this.activity!.id);
      runInAction(()=>{
        if(this.activity){
          this.activity.attendees.push(attendee);
          this.activity.isGoing = true;
          this.activityResitry.set(this.activity.id,this.activity);
          this.loading = false;
        }
      })
    }catch(error){
      runInAction(()=>{
        this.loading = false;
      })   
      toast.error("problem signing up to activity")
    }   
  }
  @action cancelAttendance = async ()=>{
    this.loading = true;
    try{
      await agent.Activities.unattend(this.activity!.id);
      runInAction(()=>{
        if(this.activity){
          this.activity.attendees = this.activity.attendees.filter(
            a=>a.username!==this.rootStore.userStore.user!.username);
            this.activity.isGoing = false;
            this.activityResitry.set(this.activity.id,this.activity);
            this.loading = false;
        }
      })
    }catch(error){
      runInAction(()=>{
        this.loading = false;
      })   
      toast.error("problem cancelling attendance")
    } 
  }

}