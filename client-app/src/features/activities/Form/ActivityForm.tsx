import React,{useState, FormEvent,useContext} from 'react'
import {Segment, Form, Button} from 'semantic-ui-react'
import { IActivity } from '../../../app/models/activity'
import {v4 as uuid} from 'uuid'
import ActivityStore from '../../../app/stores/activityStore';
import {observer} from 'mobx-react-lite'

interface IProps{
  activity:IActivity;
}

const ActivityForm:React.FC<IProps> = ({activity:initialFormState}) => {
  const activityStore = useContext(ActivityStore);
  const {createActivity,editActivity,submitting,cancelFormOpen}= activityStore;

  const initializeForm = ()=>{
    if(initialFormState){
      return initialFormState;
    }else{
      return{id:'',title:'',category:'',description:'',date:'',city:'',venue:''}
    }
  }

  const [activity,setActivity]= useState<IActivity>(initializeForm)

  const handleSubmit = ()=>{
    if(activity.id.length ===0)
    {
      let newActivity = {
        ...activity,
        id:uuid()
      }
      createActivity(newActivity);
    }else{
      editActivity(activity);
    }
  }

  const handleInputChange = (event:FormEvent<HTMLInputElement| HTMLTextAreaElement>) =>{
    const {name,value} = event.currentTarget;
    setActivity({...activity,[name]:value});
  }

  return (
    <Segment clearing>
      <Form onSubmit={handleSubmit}>
        <Form.Input name='title' onChange={handleInputChange} placeholder="Title" value={activity.title}/>
        <Form.TextArea rows={2} name='description' onChange={handleInputChange} placeholder="Description" value={activity.description}/>
        <Form.Input name='category' onChange={handleInputChange} placeholder="Category" value={activity.category}/>
        <Form.Input name='date' onChange={handleInputChange} type='datetime-local' placeholder="Date" value={activity.date} />
        <Form.Input name='city' onChange={handleInputChange} placeholder="City" value={activity.city}/>
        <Form.Input name='venue' onChange={handleInputChange} placeholder="Venue" value={activity.venue}/>
        <Button name='title' loading={submitting} floated='right' positive type='submit' content='submit'/>
        <Button name='title' onClick={cancelFormOpen} floated='right' type='button' content='cancel'/>
      </Form>
    </Segment>
  )
}

export default observer(ActivityForm);