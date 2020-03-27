import { toast } from 'react-toastify';
import { IProfile, IPhoto } from './../models/profile';
import { RootStore } from './rootStore';
import { observable, action, runInAction,computed } from 'mobx';
import agent from '../api/agent';
export default class ProfileStore {
  RootStore:RootStore
  constructor(rootStore:RootStore){
    this.RootStore = rootStore
  }

  @observable profile : IProfile | null = null;
  @observable uploadingPhoto = false;
  @observable loadingProfile = true;
  @observable loading = false;
  @computed get isCurrentUser(){
    if(this.RootStore.userStore.user && this.profile){
      return this.RootStore.userStore.user.username === this.profile.username;
    }else{
      return false;
    }
  }

  @action loadProfile = async (username:string)=>{
    this.loadingProfile = true;
    try{
      const profile = await agent.Profiles.get(username);
      runInAction(()=>{
        this.profile = profile;
        this.loadingProfile = false;
      })
    }catch(error){
      runInAction(()=>{
        this.loadingProfile = false;
      })
      console.log(error);
    }
  }
  @action uploadPhoto = async (file:Blob)=>{
    this.uploadingPhoto  =true;
    try{
      const photo = await agent.Profiles.uploadPhoto(file);
      runInAction(()=>{
        if(this.profile){
          this.profile.photos.push(photo);
          if(photo.isMain && this.RootStore.userStore.user){
            this.RootStore.userStore.user.image = photo.url;
            this.profile.image = photo.url
          }
        }
        this.uploadingPhoto = false;
      })
    }catch(error){
      console.log(error);
      toast.error('Problem uploading photo');
      runInAction(()=>{
        this.uploadingPhoto = false;
      })
    }
  }

  @action setMainPhoto = async (photo:IPhoto)=>{
    this.loading = true;
    try{
      await agent.Profiles.setMainPhoto(photo.id);
      runInAction(()=>{
        this.RootStore.userStore.user!.image = photo.url;
        this.profile!.photos.find(a=>a.isMain)!.isMain = false;
        this.profile!.photos.find(a=>a.id === photo.id)!.isMain = true;
        this.profile!.image = photo.url;
        this.loading = false;
      })
    }catch(error){
      toast.error("Problem setting photo as main");
      runInAction(()=>{
        this.loading = false;
      })      
    }
  }

  @action deletePhoto = async (photo:IPhoto)=>{
    this.loading = true;
    try{
      await agent.Profiles.deletePhoto(photo.id);
      runInAction(()=>{
        this.profile!.photos = this.profile!.photos.filter(a=>a.id !== photo.id)
        this.loading = false;
      })
    }catch(error){
      toast.error("Problem deleting photo")
      runInAction(()=>{
        this.loading = false;
      })
    }
  }
}