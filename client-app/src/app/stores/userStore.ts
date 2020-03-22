import { history } from './../../index';
import { RootStore } from './rootStore';
import { IUser, IUserFormValues } from './../models/user';
import {observable,action,computed, runInAction} from 'mobx';
import agent from '../api/agent';

export default class UserStore{
  rootStore :RootStore;
  constructor(rootStore:RootStore){
    this.rootStore = rootStore;
  }
  @observable user:IUser|null = null;

  @computed get isLoggedIn(){return !!this.user}

  @action login = async (values:IUserFormValues)=>{
    try{
      const user = await agent.User.login(values);
      this.rootStore.commonStore.setToken(user.token)
      this.rootStore.modalStore.closeModal();
      runInAction(()=>{
        this.user = user;
      })
      this.rootStore.commonStore.setToken(user.token); 
      history.push("/activities")
    }catch(error){
      throw error;
    }
  }
  @action register = async (values:IUserFormValues)=>{
    try{
      const user = await agent.User.register(values);
      this.rootStore.commonStore.setToken(user.token)
      this.rootStore.modalStore.closeModal();
      history.push('./activities')
    }catch(error){
      throw error;
    }
  }
  @action getUser = async ()=>{
    try{
      const user = await agent.User.currentUser();
      runInAction(()=>{
        this.user = user;
      })
    }catch(error){
      console.log(error);
    }
  }
  @action logout = ()=>{
    this.rootStore.commonStore.setToken(null);
    this.user = null;
    history.push('/')
  }
}