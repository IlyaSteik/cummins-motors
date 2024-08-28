import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './poster_remove.css';

import Button from "../../components/button/button";
import Input, {Textarea} from "../../components/input/input";

import {ReactComponent as IconPhoto} from "../../assets/icons/photo.svg";
import {ReactComponent as IconVideo} from "../../assets/icons/video.svg";

import {
    apiUrl,
    checkErrorAuthToken, clearStringFromUrl,
    decOfNum, getBlob, getFile, getLocalStorageData,
    multiIncludes, onFileChange, reorder, setLocalStorageData,
    shortIntegers,
    skipMsgErrorCodes,
    sleep,
    vkApi, vkApiPost
} from "../../utils/utils";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";
import Checkbox from "../../components/checkbox/checkbox";
import {ScreenSpinner, DateInput} from "@vkontakte/vkui";
import Select from "../../components/select/select";
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {}
    }

    render() {
        const {main, style} = this.props;
        const {user_data, poster_groups_data} = main.state;

        return (
            <div className='content-in content-poster' style={style}>
                <h1>Удаление постов</h1>
                <div className='table'>
                    <div className='table-in'>
                        <div className='edit-data' ref={ref => this['div-edit'] = ref}>
                            <div className='block'>
                                <h2>
                                    Ссылки на посты
                                </h2>
                                <Textarea
                                    onChange={(e) => {
                                        this.setState({urls: e.target.value});
                                    }}
                                    placeholder={'https://vk.com/draw_app?w=wall-208964042_20019\n' +
                                        'https://vk.com/wall-208964042_19989\n' +
                                        'vk.com/wall-208964042_19946'}
                                />
                            </div>
                            <div className='block'>
                                <div className='flex flex-stretch'>
                                    <Button
                                        size='l'
                                        onClick={async () => {
                                            main.setPopout(<ScreenSpinner/>);
                                            let errors = [], removed = 0, not_exist_groups = [];
                                            try {
                                                const urls = this.state.urls ?
                                                    this.state.urls.split('\n')
                                                        .filter(value => value.includes('wall'))
                                                        .map(value => value.split('wall-')[1].split('_').map(v => parseInt(v)))
                                                        .filter(value => value.filter(v => !isNaN(v)).length === 2 && poster_groups_data.find(v => v.group_id === v[0]) !== null)
                                                        .map(value => value.join('_'))
                                                    : [];
                                                console.log('urls',urls)
                                                const dont_remove_urls = this.state.urls ?
                                                    this.state.urls.split('\n').filter(value => urls.find(v => v.includes(value)) === null)
                                                    : [];
                                                console.log('dont_remove_urls', dont_remove_urls);
                                                for (let i = 0; i < Math.ceil(urls.length / 10); i++) {
                                                    const posts = urls.slice(i * 10, i * 10 + 10);
                                                    const response = await main.api('poster.removePosts', {posts});
                                                    if (response.error) {
                                                        errors.unshift(response.error.message);
                                                        break;
                                                    } else {
                                                        errors = errors.concat(response.response.errors);
                                                        removed = removed + response.response.removed;
                                                        not_exist_groups = not_exist_groups.concat(response.response.not_exist_groups);
                                                    }
                                                }

                                                main.setAlert('Результат', `Удалено: ${decOfNum(removed, ['пост', 'поста', 'постов'])}.` +
                                                    (dont_remove_urls.length > 0 ? `\n\nПосты не из вашего аккаунта (не удалены):\n${dont_remove_urls.join('<br/>')}` : '') +
                                                    (errors.length > 0 ? `\n\nОшибки:\n${errors.join('\n')}` : '') +
                                                    (not_exist_groups.length > 0 ? `\n\nОтсутствующие группы:\n${not_exist_groups.join('\n')}` : ''), [
                                                    {
                                                        title: 'Ок',
                                                        autoclose: true,
                                                        action: () => {
                                                        }
                                                    },
                                                ]);
                                            } catch (e) {
                                                main.setPopout(null);
                                                main.error(e);
                                            }
                                        }}
                                    >
                                        В работу
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}