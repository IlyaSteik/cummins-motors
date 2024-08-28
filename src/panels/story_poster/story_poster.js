import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './story_poster.css';

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

        this.state = {
            _refresh: true,
            selected_groups: [],
            custom_media: false
        }

        this.componentDidMount = this.componentDidMount.bind(this);
        this.getInputFieldsData = this.getInputFieldsData.bind(this);
    }

    componentDidMount() {

    }

    getInputFieldsData() {
        const data = {
            group_ids: [],
            publish_date: this.state.publish_date ? this.state.publish_date.getTime() : 0,
        };

        [...this[`div-edit`].getElementsByTagName('input'), ...this[`div-edit`].getElementsByTagName('select')].filter(v => v.dataset.key).forEach(input =>
            data[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value
        );

        [...this[`div-edit`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')].forEach(block => {
            const checked = block.getElementsByTagName('input')[0].checked;
            if (checked) {
                data.group_ids.push(parseInt(block.className.split('_')[1]));
            }
        });

        return data;
    }

    render() {
        const {main, style} = this.props;
        const {user_data, poster_groups_data} = main.state;
        const {_refresh, selected_groups, custom_media} = this.state;

        const data_keys = {
            media_1: 'media_1',
            media_2: 'media_2',
            url: 'link_url',
            button: 'link_text',
            add_to_news: 'add_to_news',
            interval: 'interval',
            publish_date: 'publish_date',
            need_spm: 'need_spm',
            spm_value: 'spm_value'
        };

        const select_group = (group_id) => {
            if (selected_groups.indexOf(group_id) === -1) {
                selected_groups.push(group_id);
            } else {
                selected_groups.splice(selected_groups.indexOf(group_id), 1);
            }
            this.setState({selected_groups});
            this.forceUpdate();
        }
        return (
            <div className='content-in content-story-poster' style={style}>
                <h1>Постинг историй</h1>
                <div className='table'>
                    <div className='table-in'>
                        {
                            _refresh &&
                            <div className='edit-data' ref={ref => this['div-edit'] = ref}>
                                <div className='block'>
                                    <h2>
                                        Первая история
                                    </h2>
                                    <p className='text-header-input'>
                                        Это может быть рекламной историей, файл загружать не обязательно, если нужен обычный постинг без рекламы
                                    </p>
                                    <Button
                                        className='add-story'
                                        type='file'
                                        multiple={false}
                                        onClick={(e) => {
                                            if (custom_media) {
                                                this.setState({custom_media: false});
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={async (e) => {
                                            const data = await onFileChange(e, ['video', 'image']);
                                            this.setState({custom_media: data[0]});
                                        }}
                                    >
                                        {custom_media ? 'Удалить файл' : 'Загрузить файл'}
                                    </Button>
                                </div>
                                <div className='block block-checkbox'>
                                    <Checkbox
                                        data-key={data_keys.add_to_news}
                                        id={`checkbox-add_to_news`}
                                        defaultChecked
                                    />
                                    <h2>
                                        <label htmlFor={`checkbox-add_to_news`}>Разместить историю в новостях</label>
                                    </h2>
                                </div>
                                <div className='block'>
                                    <h2>
                                        Файлы из своей базы
                                    </h2>
                                    <p className='text-header-input'>
                                        Если нужно запостить ещё несколько файлов, введите количество (файлы берутся из
                                        вашей базы медиа)
                                    </p>
                                    <Input
                                        data-key={data_keys.media_1}
                                        placeholder='Необязательное поле'
                                    />
                                </div>
                                <div className='block'>
                                    <h2>
                                        Файлы из общей базы
                                    </h2>
                                    <p className='text-header-input'>
                                        Если нужно запостить ещё несколько файлов, введите количество (файлы берутся из
                                        нашей базы медиа)
                                    </p>
                                    <Input
                                        data-key={data_keys.media_2}
                                        placeholder='Необязательное поле'
                                    />
                                </div>
                                <div className='block'>
                                    <h2>
                                        Ссылка
                                    </h2>
                                    <p className='text-header-input'>
                                        Укажите ссылку для первой истории
                                    </p>
                                    <Input
                                        data-key={data_keys.url}
                                        placeholder='Необязательное поле'
                                    />
                                </div>
                                <div className='block'>
                                    <h2>
                                        Кнопка
                                    </h2>
                                    <Select
                                        data-key={data_keys.button}
                                        options={[
                                            ['open', 'Открыть'],
                                            ['view', 'Посмотреть'],
                                            ['go_to', 'Перейти'],
                                            ['learn_more', 'Подробнее'],
                                            ['write', 'Написать'],
                                            ['more', 'Ещё'],
                                            ['to_store', 'В магазин'],
                                            ['vote', 'Голосовать'],
                                            ['book', 'Забронировать'],
                                            ['order', 'Заказать'],
                                            ['enroll', 'Записаться'],
                                            ['fill', 'Заполнить'],
                                            ['signup', 'Зарегистрироваться'],
                                            ['buy', 'Купить'],
                                            ['ticket', 'Купить билет'],
                                            ['contact', 'Связаться'],
                                            ['watch', 'Смотреть'],
                                            ['play', 'Слушать'],
                                            ['install', 'Установить'],
                                            ['read', 'Читать']
                                        ].map(v => ({
                                            label: v[1],
                                            value: v[0]
                                        }))}
                                    />
                                </div>
                                <div className='block'>
                                    <h2>
                                        Дата публикации
                                    </h2>
                                    <DateInput
                                        className='DateInput__with_title'
                                        value={this.state[data_keys.publish_date]}
                                        onChange={e => this.setState({[data_keys.publish_date]: e})}
                                        enableTime={true}
                                        disablePast={true}
                                        disableFuture={false}
                                        closeOnChange={true}
                                        disablePickers={true}
                                        showNeighboringMonth={true}
                                        disableCalendar={false}
                                    />
                                </div>
                                <div className='block'>
                                    <h2>
                                        Интервал между выходом историй (в секундах)
                                    </h2>
                                    <Input
                                        data-key={data_keys.interval}
                                        placeholder='Необязательное поле'
                                    />
                                </div>
                                <div className='block'>
                                    <span className='block block-checkbox'>
                                        <Checkbox
                                            defaultChecked
                                            data-key={data_keys.need_spm}
                                            id={`checkbox-need_spm2`}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                const el = this['div-edit'].getElementsByClassName(e.target.dataset.key)[0];
                                                el.style.display = checked ? 'flex' : 'none';
                                            }}
                                        />
                                        <h2>
                                            <label htmlFor={`checkbox-need_spm2`}>
                                                Посчитать СПМ
                                            </label>
                                        </h2>
                                    </span>
                                    <div className={`flex flex-stretch ${data_keys.need_spm}`}>
                                        <Input
                                            data-key={data_keys.spm_value}
                                            title='Значение'
                                            defaultValue='25'
                                            placeholder='Стоимость за тысячу просмотров'
                                        />
                                    </div>
                                </div>
                                <div className='block'>
                                    <div className='flex flex-select'>
                                        <h2>Выберите сообщества</h2>
                                        <span
                                            className='clickable'
                                            onClick={() => {
                                                if (selected_groups.length === poster_groups_data.length) {
                                                    this.setState({selected_groups: []});
                                                } else {
                                                    this.setState({selected_groups: poster_groups_data.map(value => value.group_id)});
                                                }
                                            }}
                                        >
                                            Выбрать все
                                        </span>
                                    </div>
                                    <Input
                                        placeholder='Поиск'
                                        onChange={e => {
                                            [
                                                ...this[`div-edit`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')
                                            ].forEach(block => {
                                                const name = block.getElementsByClassName('text')[0].innerText;
                                                if (!name.toLowerCase().includes(e.target.value.toLowerCase())) {
                                                    block.style.display = 'none';
                                                } else {
                                                    block.style.display = 'flex';
                                                }
                                            });
                                        }}
                                    />
                                    <div className='content-groups content-select'>
                                        <div
                                            className='table'
                                        >
                                            <div className='table-in'>
                                                {
                                                    poster_groups_data && poster_groups_data.map(({
                                                                                                      group_id,
                                                                                                      name,
                                                                                                      screen_name,
                                                                                                      photo_100
                                                                                                  }, index) => {
                                                            const selected = selected_groups.indexOf(group_id) > -1;
                                                            return <div
                                                                key={`group-${index}`}
                                                                className={`group-view group-view_${group_id}`}
                                                                onClick={() => select_group(group_id)}
                                                                style={{
                                                                    outline: selected && '2px solid var(--color_accent)',
                                                                }}
                                                            >
                                                                <img className='icon' alt='icon' src={photo_100}/>
                                                                <span className='number'>{index + 1}</span>
                                                                <span className='text'>{name}</span>
                                                                <span className='text text-url'>@{screen_name}</span>
                                                                <Checkbox onChange={() => select_group(group_id)}
                                                                          checked={selected}/>
                                                            </div>
                                                        }
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <div className='flex flex-stretch'>
                                        <Button
                                            size='l'
                                            onClick={async () => {
                                                main.setPopout(<ScreenSpinner/>);
                                                try {
                                                    const data = this.getInputFieldsData();
                                                    if (custom_media) {
                                                        const file_type = custom_media.type.split('/')[0];
                                                        const body = new FormData();
                                                        body.append('file', await getBlob(custom_media.src), custom_media.src.split('/')[1].split(';')[0]);
                                                        const upload = await main.apiPost('uploadStory', {type: 'base', file_type}, body);
                                                        if (upload.error) {
                                                            throw new Error(data.error.message);
                                                        } else {
                                                            data.custom_media = upload.response.id;
                                                        }
                                                    }
                                                    console.log(data);

                                                    const id = await main.api('story.post', data, true);
                                                    const poster_tasks = getLocalStorageData('story_tasks', []);
                                                    poster_tasks.push(id);
                                                    setLocalStorageData('story_tasks', poster_tasks);

                                                    main.setPopout(null);

                                                    await this.setState({_refresh: false});
                                                    this.setState({_refresh: true});
                                                    main.setState({activeLeftTab: user_data.admin ? 4 : 3});
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
                        }
                    </div>
                </div>
            </div>
        );
    }
}