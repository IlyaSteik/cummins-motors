import React, {PureComponent} from "react";
import ReactDOM from "react-dom";
import './templates.css';

import {Input, Textarea} from "../../components/input/input";
import Button from "../../components/button/button";
import Checkbox from "../../components/checkbox/checkbox";

import {ReactComponent as IconSearch} from "../../assets/icons/search.svg";
import {ReactComponent as IconAddSquare} from "../../assets/icons/add_square.svg";
import {ReactComponent as IconChevron} from "../../assets/icons/chevron_down.svg";
import {ReactComponent as IconEdit} from "../../assets/icons/edit.svg";
import {ReactComponent as IconRemove} from "../../assets/icons/remove.svg";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";
import {ReactComponent as IconPhoto} from "../../assets/icons/photo.svg";
import {ReactComponent as IconAudio} from "../../assets/icons/audio.svg";

import {Icon24AddCircleOutline} from "@vkontakte/icons";
import {Alert, ScreenSpinner, Spinner} from "@vkontakte/vkui";

import {apiUrl, getBlob, getFile, onFileChange, shortIntegers, sleep} from "../../utils/utils";
import {ReactComponent as IconPause} from "../../assets/icons/pause.svg";
import Select from "../../components/select/select";

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            searchText: ''
        }

        this.onSearch = this.onSearch.bind(this);
        this.renderMailingRow = this.renderMailingRow.bind(this);
        this.renderMailingEditRow = this.renderMailingEditRow.bind(this);
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

    renderMailingEditRow({
                             id,
                             name,
                             split_sex,
                             message,
                             message1,
                             Attachments,
                             attachments,
                             split_dialogs,
                             split_time,
                             keyboard
                         }, index) {
        const {main} = this.props;

        const remove_files = [];
        const getInputFieldsData = () => {
            const data = {
                id,
                img: [],
                audio: this[`div-edit_${id}`].getElementsByClassName('audio-btn')[0].dataset.src,
                remove_files
            };
            [...this[`div-edit_${id}`].getElementsByTagName('input'), ...this[`div-edit_${id}`].getElementsByTagName('textarea')].filter(v => v.dataset.key).forEach(input =>
                data[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value
            );
            [...this[`div-edit_${id}-grid`].getElementsByTagName('img')].forEach(img => {
                data.img.push(img.src);
            });
            [...this[`div-edit_${id}`].getElementsByClassName('block-keyboard-buttons')[0].getElementsByTagName('div')].forEach(btn => {
                    if (!data.keyboard) {
                        data.keyboard = {
                            inline: [...this[`div-edit_${id}`].getElementsByTagName('input')].find(v => v.id === `checkbox-edit_kb1_${id}`).checked,
                            buttons: []
                        };
                    }

                    data.keyboard.buttons.push(btn.dataset);
                }
            )
            return data;
        }
        const data_keys = ['name', 'message', 'attachments', 'split_dialogs', 'split_time', 'message1', 'split_sex', 'keyboard'];

        const audio = Attachments && Attachments.find(value => value.type === 'audio');
        const photos = Attachments && Attachments.filter(value => value.type === 'photo');

        return <div
            className='edit-data'
            ref={ref => this[`div-edit_${id}`] = ref}
            style={{display: 'none'}}
        >
            <h2>
                {index === -1 ? 'Введите данные шаблона' : 'Редактирование данных шаблона'}
                <span className='right'>
                    <IconCancel onClick={() => this.changeEditMode(index === -1 ? index : 0)}
                                ref={ref => this.cancelButton = ref}/>
                    {index !== -1 && <IconRemove onClick={async () => {
                        main.setPopout(<ScreenSpinner/>);
                        await main.api('mailing_template.remove', {id}, true);
                        await main.updateMailingTemplates();
                        main.setPopout(null);
                    }}/>}
                </span>
            </h2>
            <Input
                data-key={data_keys[0]}
                placeholder='Введите название шаблона'
                defaultValue={name}
            />
            <div className='block'>
                <h2>
                    Текстовое сообщение <span className='hint'
                                              style={{opacity: split_sex ? 0 : 1}}>0/4096 символов</span>
                </h2>
                <p className='description'>
                    Вы можете использовать такие параметры как: %имя% и %фамилия%.
                </p>
                <p className='description flex block-checkbox'>
                    <Checkbox
                        data-key={data_keys[6]}
                        id={`checkbox-edit_${id}`}
                        defaultChecked={split_sex}
                        onChange={value => {
                            const checked = value.target.checked;
                            const hint = this[`div-edit_${id}`].getElementsByClassName('hint')[0];
                            const textarea = [...this[`div-edit_${id}`].getElementsByClassName('textarea')].find(v => v.getElementsByTagName('textarea')[0].dataset.key === data_keys[5]);
                            if (checked) {
                                hint.style.opacity = 0;
                                textarea.style.display = 'block';
                            } else {
                                hint.style.opacity = 1;
                                textarea.style.display = 'none';
                            }
                        }}
                    />
                    <label htmlFor={`checkbox-edit_${id}`}>
                        Использовать разный текст для пола пользователя
                    </label>
                </p>
                <Textarea
                    onPasteFile={e =>
                        this[`input-attach_${id}`].props.onChange(e)
                    }
                    data-key={data_keys[1]}
                    defaultValue={message}
                    maxlength={4096}
                    onChange={(e) => {
                        this[`div-edit_${id}`].getElementsByClassName('hint')[0].innerText = `${e.target.value.length}/4096 символов`
                    }}
                    placeholder='Например: “Привет, %имя%! Не упусти уникальную возможность получить скидку 20% на весь ассортимент товаров. Поторопись, акция действует только до конца недели!”'
                />
                <Textarea
                    onPasteFile={e =>
                        this[`input-attach_${id}`].props.onChange(e)
                    }
                    data-key={data_keys[5]}
                    defaultValue={message1}
                    maxlength={4096}
                    onChange={(e) => {
                        this[`div-edit_${id}`].getElementsByClassName('hint')[0].innerText = `${e.target.value.length}/4096 символов`
                    }}
                    style={{display: split_sex ? 'block' : 'none'}}
                    placeholder='Аналогичный текст сообщения для женского пола'
                />
            </div>
            <div className='block'>
                <h2>
                    Вложения <span className='hint'>Фото (JPG, PNG, GIF), Аудиосообщение (OGG, OPUS)</span>
                </h2>
                <p className='description'>
                    Все остальные вложения можно добавить через ссылку на него.
                </p>
                <div className='flex'>
                    <Button
                        ref={ref => this[`input-attach_${id}`] = ref}
                        type='file'
                        multiple={true}
                        before={<IconPhoto/>}
                        size='l'
                        mode='secondary'
                        onChange={async (e) => {
                            const data = await onFileChange(e, 'image');
                            for (const file of data) {
                                const block = document.createElement('div');

                                const img = document.createElement('img');
                                img.alt = 'img';
                                img.src = file.src;
                                block.appendChild(img);

                                const span = document.createElement('span');
                                ReactDOM.render(<IconCancel
                                    style={{width: 16, height: 16}}
                                    onClick={() => {
                                        try {
                                            block.remove();
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }}
                                />, span);

                                block.appendChild(span);
                                this[`div-edit_${id}-grid`].appendChild(block);
                            }
                        }}
                    >
                        Добавить фото
                    </Button>
                    <Button
                        className='audio-btn'
                        type='file'
                        before={<IconAudio/>}
                        size='l'
                        mode='secondary'
                        data-src={audio && audio.id}
                        onClick={(e) => {
                            const btn = this[`div-edit_${id}`].getElementsByClassName('audio-btn')[0];
                            if (btn.getElementsByClassName('button-in')[0].innerText === 'Удалить аудио') {
                                if (!btn.dataset.src.startsWith('data')) {
                                    remove_files.push(btn.dataset.src);
                                }
                                btn.dataset.src = '';
                                btn.getElementsByClassName('button-in')[0].innerText = 'Добавить аудио';
                                e.preventDefault();
                            } else {
                                const data = getInputFieldsData();
                                if (data.attachments.length > 0 || data.img.length > 0) {
                                    main.setAlert('Ошибка', 'Нельзя добавить голосовое сообщение вместе с фото.', [
                                        {
                                            title: 'Ок',
                                            autoclose: true,
                                            action: () => {

                                            }
                                        },
                                    ]);

                                    e.preventDefault();
                                }
                            }
                        }}
                        onChange={async (e) => {
                            const data = await onFileChange(e, 'audio');
                            if (data.length === 0) return;
                            const btn = this[`div-edit_${id}`].getElementsByClassName('audio-btn')[0];
                            btn.dataset.src = data[0].src;
                            btn.getElementsByClassName('button-in')[0].innerText = 'Удалить аудио';
                        }}
                    >
                        {audio ? 'Удалить аудио' : 'Добавить аудио'}
                    </Button>
                    <Input
                        data-key={data_keys[2]}
                        defaultValue={attachments}
                        placeholder='Ссылки на вложения через запятую. Пример: video-208964042_456239077'
                        className='input-attach'
                    />
                </div>
            </div>
            <div className='block grid' ref={ref => this[`div-edit_${id}-grid`] = ref}>
                {
                    photos && photos.length > 0 && photos.map((value, index) =>
                        <div key={`attach-${index}`} id={`attach-${index}`}>
                            <img alt='img' src={value.url}/>
                            <span><IconCancel
                                style={{width: 16, height: 16}}
                                onClick={() => {
                                    try {
                                        document.getElementById(`attach-${index}`).remove();
                                    } catch (e) {
                                        console.error(e);
                                    }
                                    remove_files.push(value.id);
                                }}
                            /></span>
                        </div>
                    )
                }
            </div>
            <div className='block'>
                <h2>
                    Клавиатура
                </h2>
                <p className='description flex block-checkbox'>
                    <Checkbox
                        id={`checkbox-edit_kb_${id}`}
                        defaultChecked={!!keyboard}
                        onChange={value => {
                            const checked = value.target.checked;
                            const block = this[`div-edit_${id}`].getElementsByClassName('block-keyboard')[0];
                            if (checked) {
                                block.style.display = 'flex';
                            } else {
                                block.style.display = 'none';
                            }
                        }}
                    />
                    <label htmlFor={`checkbox-edit_kb_${id}`}>
                        Добавить клавиатуру к сообщению
                    </label>
                </p>
                <div className='block block-keyboard' style={{display: keyboard ? 'flex' : 'none'}}>
                    <p className='description flex block-checkbox'>
                        <Checkbox
                            id={`checkbox-edit_kb1_${id}`}
                            defaultChecked={keyboard && keyboard.inline}
                        />
                        <label htmlFor={`checkbox-edit_kb1_${id}`}>
                            Клавиатура внутри сообщения
                        </label>
                    </p>
                    <div className='block-keyboard-buttons'>
                        {
                            keyboard && keyboard.buttons.map((value, index) =>
                                <div
                                    key={`btn-${index}`}
                                    data-text={value.text}
                                    data-url={value.url}
                                    data-color={value.color}
                                    onClick={(e) => {
                                        e.target.remove();
                                    }}
                                >
                                    {value.text}
                                </div>
                            )
                        }
                    </div>
                    <Button
                        size='l'
                        onClick={async () => {
                            main.setPopout(
                                <Alert
                                    actionsLayout='vertical'
                                    onClose={() => main.setPopout(null)}
                                    header='Новая кнопка'
                                >
                                    <Input
                                        className='kb_input'
                                        data-key='text'
                                        title='Текст кнопки'
                                        placeholder=''
                                    />
                                    <div style={{height: 6}}/>
                                    <Input
                                        className='kb_input'
                                        data-key='url'
                                        title='Ссылка'
                                        placeholder='Если без ссылки, оставь пустым'
                                    />
                                    <div style={{height: 6}}/>
                                    <Input
                                        className='kb_input'
                                        data-key='payload'
                                        title='Полезные данные (JSON)'
                                        placeholder='Если не нужно, оставь пустым'
                                    />
                                    <div style={{height: 6}}/>
                                    <Select
                                        className='kb_input'
                                        data-key='color'
                                        title='Цвет'
                                        placeholder='primary, secondary, negative или positive'
                                        options={[
                                            {
                                                label: 'Синий',
                                                value: 'primary'
                                            },
                                            {
                                                label: 'Серый',
                                                value: 'secondary'
                                            },
                                            {
                                                label: 'Красный',
                                                value: 'negative'
                                            },
                                            {
                                                label: 'Зеленый',
                                                value: 'positive'
                                            },
                                        ]}
                                    />
                                    <div style={{height: 12}}/>
                                    <Button
                                        size='l'
                                        onClick={async () => {
                                            const block = this[`div-edit_${id}`].getElementsByClassName('block-keyboard-buttons')[0];
                                            const input_data = [...document.getElementsByClassName('kb_input')]
                                                .map(value => {
                                                    let ret = value.getElementsByTagName('input');
                                                    if (ret.length === 0) ret = value.getElementsByTagName('select');
                                                    return ret;
                                                })
                                                .map(value => [value[0].dataset.key, value[0].value]);
                                            const btn = document.createElement('div');
                                            for (const data of input_data) {
                                                if (data[0] === 'text') {
                                                    btn.innerText = data[1];
                                                }

                                                btn.dataset[data[0]] = data[1];
                                            }
                                            btn.onclick = () => btn.remove();
                                            block.appendChild(btn);
                                            main.setPopout(null);
                                        }}
                                    >
                                        Добавить
                                    </Button>
                                </Alert>
                            );
                        }}
                    >
                        Добавить кнопку
                    </Button>
                </div>
            </div>
            <div className='block'>
                <h2>Разделение базы</h2>
                <p className='description'>
                    Оно позволяет отправлять сообщения с разделением аудитории по количеству и с определенным периодом
                    рассылки.
                </p>
                <div className='flex flex-stretch'>
                    <Input
                        data-key={data_keys[3]}
                        defaultValue={split_dialogs}
                        title='Количество диалогов'
                    />
                    <Input
                        data-key={data_keys[4]}
                        defaultValue={split_time}
                        title='Временной интервал в минутах'
                    />
                    {
                        index === -1 ?
                            <Button
                                size='l'
                                onClick={async () => {
                                    main.setPopout(<ScreenSpinner/>);
                                    try {
                                        const data = getInputFieldsData();
                                        const {img, audio} = data;
                                        delete data.img;
                                        delete data.audio;
                                        data.keyboard = data.keyboard ? JSON.stringify(data.keyboard) : '';

                                        const req = await main.api('mailing_template.add', data, true);
                                        const {id} = req;

                                        if (img.length > 0) {
                                            const body = new FormData();
                                            for (let i = 0; i < img.length; i++) {
                                                const file = img[i];
                                                body.append(`file${i + 1}`, await getBlob(file), file.split('/')[1].split(';')[0]);
                                            }
                                            await main.apiPost('uploadMailingTemplate', {id, type: 'photo'}, body);
                                        }

                                        if (audio && audio.length > 0) {
                                            const body = new FormData();
                                            body.append('file', await getBlob(audio), audio.split('/')[1].split(';')[0]);
                                            await main.apiPost('uploadMailingTemplate', {id, type: 'audio'}, body);
                                        }

                                        this.changeEditMode(-1);
                                        await main.updateMailingTemplates();
                                        main.setPopout(null);
                                    } catch (e) {
                                        main.setPopout(null);
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
                                    main.setPopout(<ScreenSpinner/>);
                                    try {
                                        const data = getInputFieldsData();
                                        const img = data.img.filter(value => value.startsWith('data'));
                                        const audio = data.audio && data.audio.startsWith('data') ? data.audio : '';
                                        delete data.img;
                                        delete data.audio;
                                        data.keyboard = data.keyboard ? JSON.stringify(data.keyboard) : '';

                                        await main.api('mailing_template.edit', data, true);

                                        if (img.length > 0) {
                                            const body = new FormData();
                                            for (let i = 0; i < img.length; i++) {
                                                const file = img[i];
                                                body.append(`file${i + 1}`, await getBlob(file), file.split('/')[1].split(';')[0]);
                                            }
                                            await main.apiPost('uploadMailingTemplate', {id, type: 'photo'}, body);
                                        }

                                        if (audio && audio.length > 0) {
                                            const body = new FormData();
                                            body.append('file', await getBlob(audio), audio.split('/')[1].split(';')[0]);
                                            await main.apiPost('uploadMailingTemplate', {id, type: 'audio'}, body);
                                        }

                                        this.changeEditMode(0);
                                        await main.updateMailingTemplates(true);
                                        main.setPopout(null);
                                    } catch (e) {
                                        main.setPopout(null);
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

    renderMailingRow({
                         id,
                         name,
                         split_sex,
                         message,
                         message1,
                         Attachments,
                         attachments,
                         split_dialogs,
                         split_time,
                         keyboard
                     }, index) {
        const {main} = this.props;

        try {
            if (typeof keyboard === 'string') {
                keyboard = JSON.parse(keyboard);
            }
        } catch (e) {
            keyboard = {inline: false, buttons: []};
        }

        return <React.Fragment key={`row-${index}`}>
            <div ref={ref => this[`div-view_${id}`] = ref}>
                <span className='number'>{index + 1}</span>
                <span className='text'>{name}</span>
                <span className='actions'>
                    <Button
                        size='l'
                        after={<IconChevron/>}
                        mode='secondary'
                        onClick={() => this.changeDetailsMode(id)}
                    >
                        Информация о шаблоне
                    </Button>
                    <IconEdit onClick={() => this.changeEditMode(id)}/>
                    <IconRemove onClick={async () => {
                        main.setPopout(<ScreenSpinner/>);
                        await main.api('mailing_template.remove', {id}, true);
                        await main.updateMailingTemplates();
                        main.setPopout(null);
                    }}/>
                </span>
                <div
                    className='bottom-details'
                    ref={ref => this[`div-view-details_${id}`] = ref}
                    style={{display: 'none'}}
                >
                    {
                        split_sex ? <React.Fragment>
                                <div className='block'>
                                    <span className='text text-header'>Текстовое сообщение (мужской):</span>
                                    <span className='text'>{message}</span>
                                </div>
                                <div className='block'>
                                    <span className='text text-header'>Текстовое сообщение (женский):</span>
                                    <span className='text'>{message1}</span>
                                </div>
                            </React.Fragment>
                            :
                            <div className='block'>
                                <span className='text text-header'>Текстовое сообщение:</span>
                                <span className='text'>{message}</span>
                            </div>
                    }
                    <div className='block'>
                        <span className='text text-header'>Медиаконтент:</span>
                        <span className='text text-flex'>
                            {
                                [...attachments.split(','), ...Attachments].map((value, index) =>
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
                                keyboard && keyboard.buttons.map((value, index) =>
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
                            {(split_dialogs + split_time) < 2 ? 'Отсутствует' : `Количество диалогов: ${shortIntegers(split_dialogs)}, Временной интервал: ${split_time} мин`}
                        </span>
                    </div>
                </div>
            </div>
            {this.renderMailingEditRow({
                id,
                name,
                split_sex,
                message,
                message1,
                Attachments,
                attachments,
                split_dialogs,
                split_time,
                keyboard
            }, index)}
        </React.Fragment>
    }

    render() {
        const {main, style} = this.props;
        const {searchText} = this.state;
        const {mailing_templates_data} = main.state;
        return (
            <div className='content-in content-mailing-templates' style={style}>
                <h1>Шаблоны</h1>
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
                    Создать шаблон
                </Button>
                {this.renderMailingEditRow({id: -1}, -1)}
                <div className='table'>
                    <div className='table-header'>
                        <span>№</span>
                        <span>Название шаблона</span>
                    </div>
                    <div className='table-in'>
                        {
                            mailing_templates_data && Array.isArray(mailing_templates_data) && mailing_templates_data
                                .filter(value => searchText ? value.name.toLowerCase().includes(searchText) : true)
                                .map(this.renderMailingRow)
                        }
                        {
                            !mailing_templates_data &&
                            <Spinner size='medium'/>
                        }
                    </div>
                </div>
            </div>
        );
    }
}