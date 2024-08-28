import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './mailing.css';

import Button from "../../components/button/button";
import Input, {Textarea} from "../../components/input/input";

import {ReactComponent as IconSearch} from "../../assets/icons/search.svg";
import {ReactComponent as IconAddSquare} from "../../assets/icons/add_square.svg";
import {ReactComponent as IconChevron} from "../../assets/icons/chevron_down.svg";
import {ReactComponent as IconEdit} from "../../assets/icons/edit.svg";
import {ReactComponent as IconRemove} from "../../assets/icons/remove.svg";
import {ReactComponent as IconPlay} from "../../assets/icons/play.svg";
import {ReactComponent as IconPause} from "../../assets/icons/pause.svg";

import {
    apiUrl,
    checkErrorAuthToken, clearStringFromUrl,
    decOfNum, getBlob, getFile,
    multiIncludes,
    shortIntegers,
    skipMsgErrorCodes,
    sleep,
    vkApi, vkApiPost
} from "../../utils/utils";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";
import Checkbox from "../../components/checkbox/checkbox";
import {ScreenSpinner, Spinner} from "@vkontakte/vkui";

let unique_ids = [];
export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            searchText: ''
        }

        this.onSearch = this.onSearch.bind(this);
        this.renderSendlerRow = this.renderSendlerRow.bind(this);
        this.renderSendlerEditRow = this.renderSendlerEditRow.bind(this);
    }

    componentDidMount() {
        const action_end = (id, pause) => {
            const button = this[`div-view_${id}`].getElementsByClassName('action-pp')[0];
            const icon = button.getElementsByClassName('button-before')[0];
            const text = button.getElementsByClassName('button-in')[0];
            const btnEdit = this[`div-view_${id}`].getElementsByClassName('button-edit')[0];
            const btnRemove = this[`div-view_${id}`].getElementsByClassName('button-remove')[0];

            if (!pause) {
                button.classList.remove('button-mode-primary');
                button.classList.add('button-mode-secondary');
                ReactDOM.render(<IconPlay/>, icon);
                text.innerText = 'Перезапустить';
                btnEdit.style.display = 'none';
                btnRemove.style.display = 'block';
            } else {
                button.classList.remove('button-mode-primary');
                button.classList.add('button-mode-secondary');
                ReactDOM.render(<IconPlay/>, icon);
                text.innerText = 'Возобновить';
            }
        };

        setInterval(async () => {
            if (this.props.style.display === 'none') {
                return;
            }

            const {main} = this.props;
            const {mailing_data} = main.state;
            if (mailing_data && Array.isArray(mailing_data)) {
                for (const mailing of mailing_data) {
                    const unique_id = main.state.user_data.id + '-' + mailing.id;
                    if (unique_ids.indexOf(unique_id) === -1) {
                        unique_ids.push(unique_id);
                    }
                }
            }

            if (unique_ids && unique_ids.length > 0) {
                const response = (await main.api('mailing.getStatus', {keys: unique_ids})).response;
                for (const key of Object.keys(response)) {
                    const id = key.split('-')[1];
                    const resp = response[key];
                    if (Object.keys(resp).length === 0) {
                        return;
                    }
                    const info_block = this[`div-view_${id}`];
                    if (!info_block) {
                        return;
                    }
                    const process_block = info_block.getElementsByClassName('process')[0];
                    if (resp.error2) {
                        process_block.innerText = resp.error2;
                        action_end(id, true);
                    } else if (resp.error) {
                        process_block.innerText = resp.error;
                    } else if (resp.text) {
                        process_block.innerText = resp.text;
                    } else {
                        process_block.innerText = `${shortIntegers(resp.process)}/${shortIntegers(resp.all_dialogs)}`;
                    }

                    if (resp.all_dialogs === resp.process || resp.error) {
                        mailing_data.find(v => v.id == id).status = 0;
                        main.setState({mailing_data});
                        unique_ids.splice(unique_ids.indexOf(key), 1);
                        action_end(id);
                    }
                }
            }
        }, 3000);
    }

    onSearch(e) {
        this.setState({[e.target.dataset.key]: e.target.value});
    }

    async changeEditMode(id) {
        if (id === -1) {
            const isHide = this[`div-edit_${id}`].style.display === 'flex';
            if (isHide) {
                this[`div-edit_${id}`].style.display = 'none';
            } else {
                this[`div-edit_${id}`].style.display = 'flex';
            }
        } else {
            const {editRow} = this;
            if (editRow > 0) {
                this[`div-view_${editRow}`].style.display = 'flex';
                this[`div-edit_${editRow}`].style.display = 'none';
            }
            if (id > 0) {
                this[`div-view_${id}`].style.display = 'none';
                this[`div-edit_${id}`].style.display = 'flex';
            }
            this.editRow = id;
        }
    }

    async changeDetailsMode(id) {
        const isHide = this[`div-view-details_${id}`].style.display === 'none';

        if (isHide) {
            this[`div-view_${id}`].getElementsByClassName('actions')[0].getElementsByTagName('svg')[0].style.transform = 'rotate(180deg)';
            this[`div-view-details_${id}`].style.display = 'flex';
            const detailsHeight = this[`div-view-details_${id}`].clientHeight;
            this[`div-view_${id}`].style.paddingBottom = `${detailsHeight + 30}px`;
        } else {
            this[`div-view_${id}`].getElementsByClassName('actions')[0].getElementsByTagName('svg')[0].style.transform = 'rotate(0deg)';
            this[`div-view-details_${id}`].style.display = 'none';
            this[`div-view_${id}`].style.paddingBottom = '';
        }
    }

    renderSendlerEditRow({id, name, template_id, group_ids, dialogs, process, groups, template}, index) {

        const {main} = this.props;
        const {mailing_groups_data, mailing_templates_data} = main.state;

        const getInputFieldsData = () => {
            const data = {
                id,
                group_ids: [],
                template_id: 0
            };
            [...this[`div-edit_${id}`].getElementsByTagName('input')].filter(v => v.dataset.key).forEach(input =>
                data[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value
            );
            [...this[`div-edit_${id}`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')].forEach(block => {
                const checked = block.getElementsByTagName('input')[0].checked;
                if (checked) {
                    data.group_ids.push(parseInt(block.className.split('_')[1]));
                }
            });
            const template = [...this[`div-edit_${id}`].getElementsByClassName('content-mailing')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')].find(value => value.getElementsByTagName('input')[0].checked);
            data.template_id = template && parseInt(template.className.split('_')[1]);

            data.group_ids = data.group_ids.join(',');
            return data;
        };
        const selectData = (key, onlyOne) => {
            const block = this[`div-edit_${id}`].getElementsByClassName(key)[0];
            const checkBox = block.getElementsByClassName('checkbox')[0];
            const isSelected = checkBox.checked;

            if (isSelected) {
                block.style.outline = 'none';
                checkBox.checked = '';
            } else {
                block.style.outline = '2px solid var(--color_accent)';
                checkBox.checked = 'checked';
            }

            if (onlyOne) {
                [...this[`div-edit_${id}`].getElementsByClassName(key.split('_')[0])].forEach(e => {
                    if (e !== block) {
                        const e2 = e.getElementsByClassName('checkbox')[0];
                        e.style.outline = 'none';
                        e2.checked = '';
                    }
                })
            }
        };

        const data_keys = ['name', 'test_url'];

        return <div
            className='edit-data'
            ref={ref => this[`div-edit_${id}`] = ref}
            style={{display: 'none'}}
        >
            <h2>
                {index === -1 ? 'Введите данные рассылки' : 'Редактирование данных рассылки'}
                <span className='right'>
                    <IconCancel onClick={() => this.changeEditMode(index === -1 ? index : 0)}
                                ref={ref => this.cancelButton = ref}/>
                    {index !== -1 && <IconRemove onClick={async () => {
                        main.setPopout(<ScreenSpinner/>);
                        await main.api('mailing.remove', {id}, true);
                        await main.updateMailings();
                        main.setPopout(null);
                    }}/>}
                </span>
            </h2>
            <Input
                data-key={data_keys[0]}
                placeholder='Введите название рассылки'
                defaultValue={name}
            />
            <div className='block'>
                <div className='flex flex-select'>
                    <h2>Выберите сообщества</h2>
                    <span
                        className='clickable'
                        onClick={() => {
                            mailing_groups_data.forEach(group => selectData(`group-view_${group.group_id}`));
                        }}
                    >
                        Выбрать все
                    </span>
                </div>
                <Input
                    placeholder='Поиск'
                    onChange={e => {
                        [
                            ...this[`div-edit_${id}`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')
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
                    <div className='table'>
                        <div className='table-in'>
                            {
                                mailing_groups_data && mailing_groups_data.map(({
                                                                                    dialogs,
                                                                                    group_id,
                                                                                    name,
                                                                                    screen_name,
                                                                                    photo_100
                                                                                }, index) => {
                                        const group_selected = groups && groups.findIndex(value => value.group_id === group_id) > -1;

                                        return <div
                                            className={`group-view group-view_${group_id}`}
                                            onClick={() => {
                                                selectData(`group-view_${group_id}`);
                                            }}
                                            key={`group-${index}`}
                                            style={group_selected ? {
                                                outline: '2px solid var(--color_accent)'
                                            } : {}}
                                        >
                                            <img className='icon' alt='icon' src={photo_100}/>
                                            <span className='number'>{index + 1}</span>
                                            <span className='text'>{name}</span>
                                            <span className='text'>
                                                Диалогов доступно: {shortIntegers(dialogs)}
                                            </span>
                                            <span className='text text-url'>@{screen_name}</span>
                                            <Checkbox checked={group_selected ? 'checked' : ''} onChange={e => {
                                                selectData(`group-view_${group_id}`);
                                            }}/>
                                        </div>;
                                    }
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
            <div className='block'>
                <h2>Выберите шаблон</h2>
                <Input
                    placeholder='Поиск'
                    onChange={e => {
                        [
                            ...this[`div-edit_${id}`].getElementsByClassName('content-mailing')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')
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
                <div className='content-mailing content-select'>
                    <div className='table'>
                        <div className='table-in'>
                            {
                                mailing_templates_data && mailing_templates_data.map(({
                                                                                          id,
                                                                                          name,
                                                                                          Attachments,
                                                                                          attachments,
                                                                                          split_dialogs,
                                                                                          split_time
                                                                                      }, index) => <div
                                        className={`mailing-view mailing-view_${id}`}
                                        onClick={() => {
                                            selectData(`mailing-view_${id}`, true);
                                        }}
                                        key={`mailing-${index}`}
                                        style={template_id === id ? {
                                            outline: '2px solid var(--color_accent)'
                                        } : {}}
                                    >
                                        <span className='number'>{index + 1}</span>
                                        <span className='text'>{name}</span>
                                        <span
                                            className='text'>{decOfNum(
                                            (attachments.length > 0 ? attachments.split(',').length : 0) + Attachments.length, ['вложение', 'вложения', 'вложений'])}</span>
                                        <span
                                            className='text'>Разделение: {(split_dialogs + split_time) < 2 ? 'отсутствует' : `${shortIntegers(split_dialogs)}, ${split_time} мин`}</span>
                                        <Checkbox checked={template_id === id ? 'checked' : ''} onChange={e => {
                                            selectData(`mailing-view_${id}`, true);
                                        }}/>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
            <div className='block'>
                <h2>Тестирование</h2>
                <div className='flex flex-stretch'>
                    <Input
                        data-key={data_keys[1]}
                        defaultValue={main.state.user_data && `https://vk.com/id${main.state.user_data.id}`}
                        title='Ссылка на страницу'
                    />
                    <Button
                        size='l'
                        mode='secondary'
                        onClick={async () => {
                            const data = getInputFieldsData();
                            console.log(data);
                            if (data.group_ids.length === 0) {
                                main.error('Вы не выбрали группы.');
                                return;
                            } else if (!data.template_id) {
                                main.error('Вы не выбрали шаблон.');
                                return;
                            }
                            this.sendAction(id, 't', data);
                        }}
                    >
                        Отправить
                    </Button>
                    {
                        index === -1 ?
                            <Button
                                size='l'
                                onClick={async () => {
                                    try {
                                        const data = getInputFieldsData();
                                        console.log({data});
                                        const req = await main.api('mailing.add', data, true);
                                        console.log({req});
                                        this.changeEditMode(-1);
                                        main.updateMailings();

                                        [...this[`div-edit_${id}`].getElementsByClassName('group-view'), ...this[`div-edit_${id}`].getElementsByClassName('mailing-view')].forEach(value =>
                                            value.style.outline = ''
                                        )
                                    } catch (e) {
                                        main.error(e);
                                    }
                                }}
                            >
                                Добавить
                            </Button>
                            :
                            <Button
                                size='l'
                                onClick={async () => {
                                    try {
                                        const data = getInputFieldsData();
                                        console.log({data});
                                        const req = await main.api('mailing.edit', data, true);
                                        console.log({req});
                                        this.changeEditMode(0);
                                        main.updateMailings();
                                    } catch (e) {
                                        main.error(e);
                                    }
                                }}
                            >
                                Сохранить
                            </Button>
                    }
                </div>
            </div>
        </div>
    }

    renderSendlerRow({id, name, template_id, group_ids, dialogs, process, status}, index) {
        /*
        * status = 0 // Не запущено
        * status = 1 // В процессе
        * status = 2 // На паузе
        * */
        const {main} = this.props;
        const {mailing_groups_data, mailing_templates_data} = main.state;
        const group_ids_ = group_ids.split(',').map(value => parseInt(value));
        const groups = mailing_groups_data && mailing_groups_data.filter(value => group_ids_.indexOf(value.group_id) > -1);
        const template = mailing_templates_data && mailing_templates_data.find(value => value.id === template_id);

        if (!template) {
            return;
        }

        try {
            if (typeof template.keyboard === 'string') {
                template.keyboard = JSON.parse(template.keyboard);
            }
        } catch (e) {
            template.keyboard = {inline: false, buttons: []};
        }

        return <React.Fragment key={`row-${index}`}>
            <div ref={ref => this[`div-view_${id}`] = ref}>
                <span className='number'>{index + 1}</span>
                <span className='text'>{name}</span>
                <span className='text text-flex' style={{display: 'none'}}>
                    {new Array(5).fill(0).map((v, i) =>
                        <img alt='avatar'
                             key={`avatar-${i}`}
                             src={'https://sun9-26.userapi.com/impg/GWnFR-8ZJvydGw2cb5aNPodY-p1FEDHYTT_zTw/I5ISJCFzMZY.jpg?size=1080x1080&quality=95&sign=1b1876ff23d5f3d7803fa591619ff992&type=album'}/>
                    )}
                </span>
                <span className='number process'>{shortIntegers(process)}/{shortIntegers(dialogs)}</span>
                <span className='actions'>
                    <Button
                        size='l'
                        after={<IconChevron/>}
                        mode='secondary'
                        onClick={() => this.changeDetailsMode(id)}
                    >
                        {main.mobile ? 'Информация' : 'Информация о рассылке'}
                    </Button>
                    <Button
                        className='action-pp'
                        size='l'
                        before={status !== 1 ? <IconPlay/> : <IconPause/>}
                        mode={status !== 1 ? 'secondary' : 'primary'}
                        onClick={() => {
                            this.sendAction(id, 'c');
                        }}
                    >
                        {
                            (status === 0 ? 'Запустить' : (
                                    status === 1 ? 'Приостановить' :
                                        status === 2 && 'Возобновить')
                            )
                        }
                    </Button>
                    <IconEdit className='button-edit' onClick={() => this.changeEditMode(id)}
                              style={{display: status !== 0 && 'none'}}/>
                    <IconRemove style={{display: status !== 0 && 'none'}} className='button-remove'
                                onClick={async () => {
                                    main.setPopout(<ScreenSpinner/>);
                                    await main.api('mailing.remove', {id}, true);
                                    await main.updateMailings();
                                    main.setPopout(null);
                                }}/>
                </span>
                <div
                    className='bottom-details'
                    ref={ref => this[`div-view-details_${id}`] = ref}
                    style={{display: 'none'}}
                >
                    <div className='block'>
                        <span className='text text-header'>Сообщества:</span>
                        <span className='groups-grid'>
                            {
                                groups.map((value, index) =>
                                    <span className='text' key={`group-${index}`}>
                                        <img alt='avatar' src={value.photo_100}/>
                                        {value.name}
                                    </span>
                                )
                            }
                        </span>
                    </div>
                    {
                        template && template.split_sex ? <React.Fragment>
                                <div className='block'>
                                    <span className='text text-header'>Текстовое сообщение (мужской):</span>
                                    <span className='text'>{template && template.message}</span>
                                </div>
                                <div className='block'>
                                    <span className='text text-header'>Текстовое сообщение (женский):</span>
                                    <span className='text'>{template && template.message1}</span>
                                </div>
                            </React.Fragment>
                            :
                            <div className='block'>
                                <span className='text text-header'>Текстовое сообщение:</span>
                                <span className='text'>{template && template.message}</span>
                            </div>
                    }
                    <div className='block'>
                        <span className='text text-header'>Медиаконтент:</span>
                        <span className='text text-flex'>
                            {
                                template && [...template.Attachments, template.attachments].map((value, index) =>
                                    <span
                                        className='text text-url' key={`attach-${index}`}
                                        onClick={() => open(typeof value === 'string' ? `https://vk.com/${value}` : value.url)}
                                    >
                                        {typeof value === 'string' ? value : `${value.type}-${index}`}
                                    </span>
                                )
                            }
                        </span>
                    </div>
                    <div className='block'>
                        <span className='text text-header'>Клавиатура:</span>
                        <span className='text text-flex'>
                            {
                                template && template.keyboard && template.keyboard.buttons.length > 0 && template.keyboard.buttons.map((value, index) =>
                                    <span
                                        className='text' key={`kb-${index}`}
                                    >
                                        {value.text}
                                    </span>
                                )
                            }
                        </span>
                    </div>
                    <div className='block'>
                        <span className='text text-header'>Разделение базы:</span>
                        <span className='text'>
                            {template && ((template.split_dialogs + template.split_time) < 2 ? 'Отсутствует' : `Количество диалогов: ${shortIntegers(template.split_dialogs)}, Временной интервал: ${template.split_time} мин`)}
                        </span>
                    </div>
                </div>
            </div>
            {this.renderSendlerEditRow({id, name, template_id, group_ids, dialogs, process, groups, template}, index)}
        </React.Fragment>;
    }

    async getAudioAttachment(group, template, peer_id) {
        /*const {audio} = template;
        const {access_token} = group;

        if (audio && audio.length > 0) {
            const get_upload_server = await vkApi('docs.getMessagesUploadServer', {
                type: 'audio_message',
                access_token,
                peer_id
            }, group.proxy);
            if (get_upload_server.error) {
                throw new Error(`Ошибка загрузки аудиофайла: ${get_upload_server.error.error_msg}`);
            }
            const {upload_url} = get_upload_server.response;
            const body = new FormData();
            body.append('file', await getBlob(getFile(audio)), audio.split('/')[1]);
            const upload_response = await vkApiPost(upload_url, body, group.proxy);
            if (upload_response.file) {
                const upload_save = await vkApi('docs.save', {
                    access_token,
                    file: upload_response.file
                }, group.proxy);
                if (upload_save.error) {
                    throw new Error(`Ошибка загрузки аудиофайла: ${upload_save.error.error_msg}`);
                }
                const {id, owner_id} = upload_save.response.audio_message;
                return `audio_message${owner_id}_${id}`;
            } else {
                console.error(upload_response);
                throw new Error('Ошибка загрузки аудиофайла.' + upload_response.error ? ` ${upload_response.error.error_msg}` : '');
            }
        } else {
            return '';
        }*/
    }

    async getAttachments(id, data) {
        /*const attachments = template.attachments.length > 0 ? template.attachments.split(',') : [];
        const files = template.files.length > 0 ? template.files.split(',') : [];

        const {access_token} = group;

        if (files.length > 0) {
            const body = new FormData();
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                body.append(`file${i + 1}`, await getBlob(getFile(file)), file.split('/')[1]);
            }
            const upload_url = await vkApi('photos.getMessagesUploadServer', {access_token}, group.proxy);
            if (upload_url.error) {
                throw new Error(`Ошибка получения ссылки на загрузку фото: ${upload_url.error.error_msg}`);
            }

            const upload_response = await vkApiPost(upload_url.response.upload_url, body, group.proxy);
            if (upload_response.error) {
                throw new Error(`Ошибка загрузки фото: ${upload_response.error.error_msg}`);
            }

            const upload_save = await vkApi('photos.saveMessagesPhoto', {
                ...upload_response, access_token
            }, group.proxy);
            if (upload_save.error) {
                throw new Error(`Ошибка сохранения фото: ${upload_save.error.error_msg}`);
            }

            for (const item of upload_save.response) {
                attachments.push(`photo${item.owner_id}_${item.id}`);
            }
        }

        if (attachments.length === 0) {
            const audio = await this.getAudioAttachment(group, template, peer_id);
            if (audio.length > 0) {
                attachments.push(audio);
            }
        }

        return attachments;*/

        const {main} = this.props;
        return await main.api('mailing.getAttachments', {id, data: data && JSON.stringify(data)});
    }

    /*
    * @param {int} id рассылки
    * @param {string} act s (start), p (pause), t (test), c (click), r (resume);
    * */
    async sendAction(id, act, data, update_base) {
        console.log('sendAction', {id, act, data, update_base});
        const {main} = this.props;
        const unique_process_key = main.state.user_data.id + '-' + (data ? data.id : id);

        if (act === 'p') {
            await main.api('mailing.pause', {id, pause: true});
        } else if (act === 's') {
            unique_ids.push(unique_process_key);
            const resp = await main.api('mailing.start', {
                id,
                act,
                ...data ? {data: JSON.stringify(data)} : {},
                ...update_base ? {update_base: true} : {}
            });
            if (resp.error) {
                unique_ids.splice(unique_ids.indexOf(unique_process_key), 1);
                main.error(resp.error.message);
            }
        } else if (act === 'r') {
            await main.api('mailing.pause', {id});
        } else if (act === 'c') {
            const button = this[`div-view_${id}`].getElementsByClassName('action-pp')[0];
            const icon = button.getElementsByClassName('button-before')[0];
            const text = button.getElementsByClassName('button-in')[0];
            const btnEdit = this[`div-view_${id}`].getElementsByClassName('button-edit')[0];
            const btnRemove = this[`div-view_${id}`].getElementsByClassName('button-remove')[0];
            if (text.innerText === 'Возобновить' || text.innerText === 'Запустить' || text.innerText === 'Перезапустить') {
                if (text.innerText === 'Запустить' || text.innerText === 'Перезапустить') {
                    const {mailing_data} = main.state;
                    const mailing = mailing_data.find(value => value.id === id);
                    console.log('mailing', mailing);
                    this.sendAction(id, 's');
                    /*await new Promise(res => {
                        main.setAlert('Обновление базы', 'Обновить базу для всех групп перед рассылкой?', [
                            {
                                title: 'Обновить',
                                autoclose: true,
                                action: () => {
                                    this.sendAction(id, 's', null, true);
                                    res(true);
                                }
                            },
                            {
                                title: 'Пропустить',
                                autoclose: true,
                                action: () => {
                                    this.sendAction(id, 's');
                                    res(true);
                                }
                            },
                        ]);
                    })*/
                } else {
                    this.sendAction(id, 'r');
                }

                button.classList.remove('button-mode-secondary');
                button.classList.add('button-mode-primary');
                ReactDOM.render(<IconPause/>, icon);
                text.innerText = 'Приостановить';
                btnEdit.style.display = 'none';
                btnRemove.style.display = 'none';

                /*window.onbeforeunload = () => {
                    return false;
                };*/
            } else if (text.innerText === 'Приостановить') {
                button.classList.remove('button-mode-primary');
                button.classList.add('button-mode-secondary');
                ReactDOM.render(<IconPlay/>, icon);
                text.innerText = 'Возобновить';
                this.sendAction(id, 'p');
            }
        } else if (act === 't') {
            main.setPopout(<ScreenSpinner/>);
            const resp = await main.api('mailing.start', {id, act, ...data ? {data: JSON.stringify(data)} : {}});
            main.setPopout(null);
            if (resp.error) {
                main.error(resp.error.message);
            }
        }
        /*try {
            main.setPopout(<ScreenSpinner/>);
            const {mailing_data, mailing_groups_data, mailing_templates_data} = main.state;
            let process = 0, errors = 0, process_split_dialogs = 0;


            // Подгружаем данные из бд

            const mailing = mailing_data.find(value => value.id === id);

            const group_ids = (data || mailing).group_ids.split(',').map(value => parseInt(value));
            const groups = mailing_groups_data.filter(value => group_ids.indexOf(value.group_id) > -1);

            const template = mailing_templates_data.find(value => value.id === (data || mailing).template_id);

            try {
                if (typeof template.keyboard === 'string') {
                    template.keyboard = JSON.parse(template.keyboard);
                }
            } catch (e) {
                template.keyboard = {inline: false, buttons: []};
            }

            let keyboard = {...template.keyboard};
            if (keyboard && keyboard.buttons.length > 0) {
                keyboard.buttons = keyboard.buttons.map(value => ([{
                    action: {
                        type: value.url && value.url.length > 0 ? 'open_link' : 'text',
                        label: value.text,
                        ...(value.url && value.url.length > 0 ? {
                            link: value.url
                        } : {})
                    },
                    ...(value.url && value.url.length > 0 ? {} : {
                        color: value.color
                    })
                }]))
                keyboard = JSON.stringify(keyboard);
            }

            const params_to_replace = {
                '%имя%': 'first_name',
                '%фамилия%': 'last_name'
            };
            const params_to_replace_keys = Object.keys(params_to_replace);

            let attachment = await this.getAttachments(mailing ? mailing.id : null, mailing ? null : data=);
            if (attachment.error) {
                throw new Error(attachment.error.message);
            } else {
                attachment = attachment.response;
            }


            //Тестовая рассылка

            if (act === 't') {
                const user_data = (await vkApi('users.get', {
                    user_id: clearStringFromUrl(data.test_url),
                    fields: 'first_name, last_name, sex',
                    access_token: main.access_token
                })).response[0];

                let message = template.split_sex ? (user_data.sex === 1 ? template.message1 : template.message) : template.message;
                if (message) {
                    for (const key of params_to_replace_keys) {
                        message = message.replace(key, user_data[params_to_replace[key]]);
                    }
                }

                for (let i = 0; i < groups.length; i++) {
                    const group = groups[i];
                    console.log('Попытка отправить сообщение с группы: ' + group.group_id);

                    await vkApi('messages.send', {
                        peer_ids: user_data.id,
                        message: message || '',
                        attachment: attachment[group.group_id].join(','),
                        access_token: group.access_token,
                        random_id: 0,
                        keyboard
                    }, group.proxy);
                }


                main.setPopout(null);
                return;
            }


            // Подготовка данных для рассылки

            const group_user_ids = {};
            const users_data = {};
            for (const group of groups) {
                const group_dialogs = await vkApi('messages.getConversations', {
                    access_token: group.access_token,
                    count: 1
                }, group.proxy);
                if (group_dialogs.error) {
                    throw new Error(`Группа: @${group.screen_name}, Ошибка: ${group_dialogs.error.error_msg}`);
                }
                group.dialogs = group_dialogs.response.count;

                group_user_ids[group.group_id] = [];

                for (let offset = 0; offset <= group.dialogs; offset += 100) {
                    const get_conv = await vkApi('messages.getConversations', {
                        access_token: group.access_token,
                        count: 100, offset,
                        extended: 1,
                        fields: 'first_name, last_name, sex'
                    }, group.proxy);
                    if (get_conv.error) {
                        offset -= 100;
                        await sleep(1000);
                    } else {
                        group_user_ids[group.group_id] = group_user_ids[group.group_id].concat(
                            get_conv.response.items
                                .map(item => item.conversation.peer.type === 'user' ? item.conversation.peer.id : 0)
                                .filter(value => value !== 0 && value < 2000000000)
                        );

                        get_conv.response.profiles.forEach(profile => {
                            users_data[profile.id] = profile;
                        });
                    }
                    await sleep(100);
                }
            }
            const all_dialogs = groups.map(value => value.dialogs).reduce((a, b) => a + b);
            const process_block = info_block.getElementsByClassName('process')[0];
            process_block.innerText = `${shortIntegers(process)}/${shortIntegers(all_dialogs)}`;

            main.setPopout(null);

            console.log({mailing, groups, template, info_block, group_user_ids, users_data});

            //Начинаем процесс рассылки

            for (let i = 0; i < groups.length; i++) {
                const group = groups[i];
                console.log('Рассылка от группы: ' + group.group_id);

                const user_ids = [];

                // 1 = woman, key message1
                // 2 = man, key message

                if (template.split_sex) {
                    group_user_ids[group.group_id].forEach(user_id => {
                        const user_data = users_data[user_id];
                        const key = user_data && user_data.sex === 1 ? 0 : 1;
                        if (!user_ids[key]) user_ids[key] = [];

                        user_ids[key].push(user_id);
                    });
                } else {
                    user_ids[0] = group_user_ids[group.group_id];
                }

                for (let j = 0; j < user_ids.length; j++) {
                    const uids = user_ids[j];
                    if (uids) {
                        let offset_plus = 100;
                        const need_to_replace = !template.message ? false : multiIncludes(template.message, params_to_replace_keys) || multiIncludes(template.message1, params_to_replace_keys);
                        if (need_to_replace) {
                            offset_plus = 1;
                        }
                        if (offset_plus > template.split_dialogs && template.split_dialogs > 0) {
                            offset_plus = template.split_dialogs;
                        }

                        for (let offset = 0; offset < uids.length; offset += offset_plus) {
                            if (this[`pause_sendler${id}`]) {
                                await sleep(1000);
                                offset -= offset_plus;
                            } else {
                                let peer_ids = uids.slice(offset, offset + offset_plus);
                                let message = user_ids.length === 1 ? template.message : (j === 0 ? template.message1 : template.message);
                                if (need_to_replace) {
                                    for (const key of params_to_replace_keys) {
                                        message = message.replace(key, users_data[peer_ids[0]][params_to_replace[key]]);
                                    }
                                }

                                const send_msg = await vkApi('messages.send', {
                                    peer_ids,
                                    attachment: attachment[group.group_id].join(','),
                                    message: message || '',
                                    access_token: group.access_token,
                                    random_id: 0,
                                    keyboard
                                }, group.proxy);

                                if (send_msg.response) {
                                    let need_wait_split = false;

                                    for (const resp of send_msg.response) {
                                        if (resp.hasOwnProperty('message_id')) {
                                            process++;
                                            process_block.innerText = `${shortIntegers(process)}/${shortIntegers(all_dialogs)}`;
                                        } else {
                                            errors++;
                                        }

                                        if (template.split_dialogs > 0) {
                                            process_split_dialogs++;
                                            if (process_split_dialogs % template.split_dialogs === 0) {
                                                need_wait_split = true;
                                            }
                                        }
                                    }

                                    if (need_wait_split && process < all_dialogs) {
                                        await sleep(template.split_time * 60 * 1000);
                                    }
                                } else {
                                    if (!skipMsgErrorCodes(send_msg)) {
                                        offset -= offset_plus;
                                        await sleep(3000);
                                    } else {
                                        console.log({group, send_msg, offset});
                                        throw new Error(`Группа: @${group.screen_name}, Ошибка: ${send_msg.error.error_msg}`);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            action_end();
        } catch (e) {
            action_end();

            console.error(e);
            main.error(e);
        }*/
    }

    render() {
        const {main, style} = this.props;
        const {searchText} = this.state;
        const {user_data, mailing_data, mailing_groups_data, mailing_templates_data} = main.state;
        return (
            <div className='content-in content-mailing' style={style}>
                <h1>Рассылки</h1>
                <Input
                    data-key='searchText'
                    className='search'
                    placeholder='Воспользуйтесь поисковой строкой...'
                    value={searchText}
                    onChange={this.onSearch}
                    after={false && <IconSearch
                        onClick={() => {
                            console.log('test');
                        }}
                    />}
                />
                <Button
                    size='xl'
                    before={<IconAddSquare/>}
                    className='add'
                    shadow={true}
                    onClick={() => this.changeEditMode(-1)}
                >
                    Новая рассылка
                </Button>
                {this.renderSendlerEditRow({id: -1}, -1)}
                <div className='table'>
                    <div className='table-header'>
                        <span>№</span>
                        <span>Название рассылки</span>
                        <span style={{display: 'none'}}>Сообщества</span>
                        <span>Процесс</span>
                    </div>
                    <div className='table-in'>
                        {
                            mailing_groups_data && mailing_templates_data && mailing_data && Array.isArray(mailing_data) && mailing_data
                                .filter(value => searchText ? value.name.toLowerCase().includes(searchText) : true)
                                .map(this.renderSendlerRow)
                        }
                        {
                            !(mailing_groups_data && mailing_templates_data && mailing_data) &&
                            <Spinner size='medium'/>
                        }
                    </div>
                </div>
            </div>
        );
    }
}