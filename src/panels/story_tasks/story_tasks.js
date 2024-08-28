import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './story_tasks.css';

import Button from "../../components/button/button";
import Input, {Textarea} from "../../components/input/input";

import {ReactComponent as IconPhoto} from "../../assets/icons/photo.svg";
import {ReactComponent as IconVideo} from "../../assets/icons/video.svg";

import {
    apiUrl,
    checkErrorAuthToken, clearStringFromUrl,
    decOfNum, getBlob, getFile, getLocalStorageData,
    multiIncludes, onFileChange, openLinkFromText, openUrl, setLocalStorageData,
    shortIntegers,
    skipMsgErrorCodes,
    sleep,
    vkApi, vkApiPost
} from "../../utils/utils";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";
import Checkbox from "../../components/checkbox/checkbox";
import {ScreenSpinner, DateInput, Spinner} from "@vkontakte/vkui";

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            data: {},
        }

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    componentDidMount() {
        setInterval(async () => {
            if (this.props.style.display === 'none') {
                return;
            }

            /*const story_tasks = getLocalStorageData('story_tasks', []);
            if (story_tasks.length === 0) {
                return;
            }*/

            const {main} = this.props;
            const response = (await main.api('story.getStatus', {/*keys: [...story_tasks].reverse()*/})).response;
            /*const response_keys = Object.keys(response);
            const remove_keys = story_tasks.filter(key => response_keys.indexOf(key) === -1);
            if (remove_keys.length > 0) {
                for (const key of remove_keys) {
                    story_tasks.splice(story_tasks.indexOf(key), 1);
                }
                setLocalStorageData('story_tasks', story_tasks);
            }*/

            this.setState({data: response});
        }, 3000);
    }

    render() {
        const {main, style} = this.props;
        const {poster_groups_data} = main.state;
        const {data} = this.state;
        const keys = Object.keys(data);

        return (
            <div className='content-in content-story-tasks' style={style}>
                <h1>Текущие задачи</h1>
                <h2>Список историй, которые находятся в работе или были недавно{keys.length === 0 ? '. Вы ещё не создавали истории, поэтому тут пусто.' : ''}</h2>
                <div className='table'>
                    <div className='table-in'>
                        {
                            poster_groups_data && Array.isArray(poster_groups_data) && keys.map((key, index) => {
                                const {status, groups, errors, success, publish_date, spm} = data[key];
                                return <div className='edit-data' key={`block-${index}`}>
                                    <div className='bottom-details'>
                                        <div className='block'>
                                            <span className='text text-header'>
                                                Внутренний айди
                                            </span>
                                            <span className='text'>
                                                {key}
                                            </span>
                                        </div>
                                        <div className='block'>
                                            <span className='text text-header'>Сообщества:</span>
                                            <span className='groups-grid'>
                                                {
                                                    groups.map(v => poster_groups_data.find(v2 => v2.group_id === v.group_id)).filter(v3 => v3).map((group, i) =>
                                                        <span className='text' key={`group-${i}`}>
                                                            <img alt='avatar' src={group.photo_100}/>
                                                            {group.name}
                                                        </span>
                                                    )
                                                }
                                            </span>
                                        </div>
                                        <div className='block'>
                                            <span className='text text-header'>
                                                Текущий статус
                                            </span>
                                            <span className='text' onClick={() => openLinkFromText(status)}>
                                                {status}
                                            </span>
                                        </div>
                                        {
                                            (publish_date && publish_date > 0) &&
                                            <div className='block'>
                                                <span className='text text-header'>
                                                    Дата публикации
                                                </span>
                                                <span className='text'>
                                                    {new Date(publish_date).toLocaleDateString('ru', {
                                                        day: 'numeric',
                                                        month: 'numeric',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        minute: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        }
                                        {
                                            success.length > 0 && <div className='block block-url'>
                                                <span className='text text-header'>
                                                    Опубликованные истории
                                                </span>
                                                {success.map((v, i) =>
                                                    <span
                                                        className='text' key={`post-${i}`}
                                                        onClick={() => v !== '-' && openUrl('https://' + v)}
                                                    >
                                                        {i + 1}. {v}
                                                    </span>
                                                )}
                                            </div>
                                        }
                                        {
                                            errors.length > 0 && <div className='block'>
                                                <span className='text text-header'>
                                                    Ошибки
                                                </span>
                                                {errors.map((v, i) =>
                                                    <span
                                                        className='text' key={`err-${i}`}
                                                        onClick={() => {
                                                            openLinkFromText(v);
                                                        }}
                                                    >
                                                        {v}
                                                    </span>
                                                )}
                                            </div>
                                        }
                                        {
                                            status.includes('Все публикации загружены') ?
                                                <div className='flex flex-stretch'>
                                                    <Button
                                                        size='l'
                                                        onClick={() => {
                                                            /*const story_tasks = getLocalStorageData('story_tasks', []);
                                                            story_tasks.splice(story_tasks.indexOf(key), 1);
                                                            setLocalStorageData('story_tasks', story_tasks);*/
                                                            delete data[key];
                                                            this.setState({data});

                                                            main.setPopout(<ScreenSpinner/>);
                                                            main.api('story.removePosting', {id: key});
                                                            main.setPopout(null);
                                                        }}
                                                    >
                                                        Удалить из истории
                                                    </Button>
                                                </div>
                                                :
                                                <div className='flex flex-stretch'>
                                                    <Button
                                                        size='l'
                                                        mode='red'
                                                        onClick={() => {
                                                            main.setPopout(<ScreenSpinner/>);
                                                            main.api('story.removePosting', {id: key});
                                                            main.setPopout(null);

                                                            /*const story_tasks = getLocalStorageData('story_tasks', []);
                                                            story_tasks.splice(story_tasks.indexOf(key), 1);
                                                            setLocalStorageData('story_tasks', story_tasks);*/
                                                            delete data[key];
                                                            this.setState({data});
                                                        }}
                                                    >
                                                        Завершить задачу
                                                    </Button>
                                                </div>
                                        }
                                    </div>
                                </div>
                            })
                        }
                        {
                            !(poster_groups_data && Array.isArray(poster_groups_data)) &&
                            <Spinner size='medium'/>
                        }
                    </div>
                </div>
            </div>
        );
    }
}