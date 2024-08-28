import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './poster.css';

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
            defaultValues: {}
        }

        this.componentDidMount = this.componentDidMount.bind(this);
        this.getInputFieldsData = this.getInputFieldsData.bind(this);

        const poster_draft = getLocalStorageData('poster_draft');
        if (poster_draft) {
            setTimeout(() => {
                setLocalStorageData('poster_draft', null);
            }, 3000);
            this.state.defaultValues = poster_draft;
        }
    }

    selectAutoEdit(checked) {
        [...this[`div-edit`].getElementsByClassName('block-auto_edit')].forEach(el => el.style.display = checked ? '' : 'none');
    }

    selectAutoEditKey(key, checked) {
        [...this[`div-edit`].getElementsByClassName(key)].forEach(el => el.style.display = checked ? '' : 'none');
    }

    componentDidMount() {
        this.selectAutoEdit(false);
    }

    getInputFieldsData() {
        const data = {
            img1: [],
            video1: [],
            img2: [],
            video2: [],
            comment_img: [this[`div-edit`].getElementsByClassName('photo-comment')[0].dataset.src],
            comment_img2: [this[`div-edit`].getElementsByClassName('photo-comment2')[0].dataset.src],
            group_ids: []
        };
        if (data.comment_img[0].length === 0) {
            data.comment_img = [];
        }
        if (data.comment_img2[0].length === 0) {
            data.comment_img2 = [];
        }

        [...this[`div-edit`].getElementsByTagName('input'), ...this[`div-edit`].getElementsByTagName('textarea'), ...this[`div-edit`].getElementsByTagName('select')].filter(v => v.dataset.key).forEach(input =>
            data[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value
        );

        [...this[`div-edit`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')].forEach(block => {
            const checked = block.getElementsByTagName('input')[0].checked;
            if (checked) {
                data.group_ids.push(parseInt(block.className.split('_')[1]));
            }
        });

        [
            ['div-edit-grid', 'img', 'img1'],
            ['div-edit-grid', 'video', 'video1'],
            ['div-edit-grid2', 'img', 'img2'],
            ['div-edit-grid2', 'video', 'video2']
        ].forEach(d => {
            [...this[d[0]].getElementsByTagName(d[1])].forEach(v => {
                data[d[2]].push(v.src);
            })
        });

        ['publish_date', 'edit_time', 'auto_remove'].forEach(key =>
            data[key] = this.state[key] ? Math.floor(this.state[key].getTime() / 1000) : ''
        );

        /*[...this[`div-edit`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')].forEach(block => {
            const checked = block.getElementsByTagName('input')[0].checked;
            if (checked) {
                data.group_ids.push(parseInt(block.className.split('_')[1]));
            }
        });*/

        data.group_ids = data.group_ids.join(',');

        return data;
    }

    render() {
        const {main, style} = this.props;
        const {user_data, poster_groups_data} = main.state;
        const {_refresh, selected_groups, defaultValues} = this.state;

        const data_keys = {
            message: 'message',
            attachments: 'attachments',
            primary_attachments_mode: 'primary_attachments_mode',
            comment: 'comment',
            comment_attachment: 'comment_attachment',
            close_comments: 'close_comments',
            publish_date: 'publish_date',
            auto_edit: 'auto_edit',
            copyright: 'copyright',
            copyright2: 'copyright2',
            interval: 'interval',
            need_spm: 'need_spm',
            spm_value: 'spm_value',
            spm_time: 'spm_time',
            auto_edit_keys: {
                message: 'message2',
                attachments: 'attachments2',
                primary_attachments_mode: 'primary_attachments_mode2',
                comment: 'comment2',
                comment_attachment: 'comment_attachment2',
                time: 'edit_time'
            },
            auto_remove: 'auto_remove',

            change_text: 'change_text',
            change_attachments: 'change_attachments',
            change_comment: 'change_comment',
            change_copyright: 'change_copyright',
            enable_cheat: 'enable_cheat'
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
            <div className='content-in content-poster' style={style}>
                <h1>Стандартный постинг</h1>
                <div className='table'>
                    <div className='table-in'>
                        {
                            _refresh &&
                            <div className='edit-data' ref={ref => this['div-edit'] = ref}>
                                <div className='block'>
                                    <h2>
                                        Текст поста <span className='hint'>0/10 000 символов</span>
                                    </h2>
                                    <Textarea
                                        onPasteFile={e =>
                                            this.inputAttachPostImage.props.onChange(e)
                                        }
                                        data-key={data_keys.message}
                                        maxlength={10000}
                                        onChange={(e) => {
                                            this['div-edit'].getElementsByClassName('hint')[0].innerText = `${e.target.value.length}/10 000 символов`;
                                        }}
                                        placeholder='Это мог быть чудесный пост с прекрасными вложениями.'
                                        defaultValue={defaultValues[data_keys.message]}
                                    />
                                </div>
                                <div className='block block-attachment'>
                                    <div className='flex flex-stretch'>
                                        <div className='block'>
                                            <h2>
                                                Вложения <span className='hint'>Фото (JPG, PNG, GIF), Видео (AVI, MP3, MP4, MPEG, MOV)</span>
                                            </h2>
                                            <Input
                                                data-key={data_keys.attachments}
                                                placeholder='Ссылки на вложения через запятую. Пример: video-208964042_456239077'
                                                onPasteFile={e =>
                                                    this.inputAttachPostImage.props.onChange(e)
                                                }
                                                defaultValue={defaultValues[data_keys.attachments]}
                                            />
                                        </div>
                                        <div className='block'>
                                            <h2>
                                                Способ отображения вложений
                                            </h2>
                                            <Select
                                                data-key={data_keys.primary_attachments_mode}
                                                options={[
                                                    {
                                                        label: 'Сетка',
                                                        value: 'grid'
                                                    },
                                                    {
                                                        label: 'Карусель',
                                                        value: 'carousel'
                                                    },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    <div className='flex'>
                                        <Button
                                            ref={ref => this.inputAttachPostImage = ref}
                                            type='file'
                                            multiple={true}
                                            mode='icon'
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
                                                    this[`div-edit-grid`].appendChild(block);
                                                }
                                            }}
                                        >
                                            <IconPhoto/>
                                        </Button>
                                        <Button
                                            type='file'
                                            multiple={true}
                                            mode='icon'
                                            onChange={async (e) => {
                                                const data = await onFileChange(e, 'video');
                                                for (const file of data) {
                                                    const block = document.createElement('div');

                                                    const video = document.createElement('video');
                                                    video.alt = 'video';
                                                    video.src = file.src;
                                                    block.appendChild(video);

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
                                                    this[`div-edit-grid`].appendChild(block);
                                                }
                                            }}
                                        >
                                            <IconVideo/>
                                        </Button>
                                    </div>
                                </div>
                                <div className='block grid' ref={ref => this[`div-edit-grid`] = ref}/>
                                <div className='block'>
                                    <h2>
                                        Первый комментарий
                                        <span className='description flex block-checkbox'>
                                            <Checkbox
                                                data-key={data_keys.close_comments}
                                                id={`checkbox-close_comments`}
                                                defaultChecked={defaultValues.hasOwnProperty(data_keys.close_comments) ? defaultValues[data_keys.close_comments] == 1 : true}
                                            />
                                            <label htmlFor={`checkbox-close_comments`}>
                                                Закрыть комментарии после публикации
                                            </label>
                                        </span>
                                    </h2>
                                    <Textarea
                                        data-key={data_keys.comment}
                                        placeholder='Тут кажется спряталась реклама... а может и нет...'
                                        onPasteFile={e =>
                                            this.inputAttachCommentImage.props.onChange(e)
                                        }
                                        defaultValue={defaultValues[data_keys.comment]}
                                    />
                                    <Button
                                        ref={ref => this.inputAttachCommentImage = ref}
                                        className='photo-comment'
                                        type='file'
                                        multiple={true}
                                        before={<IconPhoto/>}
                                        size='l'
                                        mode='secondary'
                                        data-src={''}
                                        onClick={(e) => {
                                            const btn = this[`div-edit`].getElementsByClassName('photo-comment')[0];
                                            if (btn.getElementsByClassName('button-in')[0].innerText === 'Удалить фото из комментария') {
                                                btn.dataset.src = '';
                                                btn.getElementsByClassName('button-in')[0].innerText = 'Добавить фото к комментарию';
                                                e.preventDefault();
                                            }
                                        }}
                                        onChange={async (e) => {
                                            const data = await onFileChange(e, 'image');
                                            if (data.length === 0) return;
                                            const btn = this[`div-edit`].getElementsByClassName('photo-comment')[0];
                                            btn.dataset.src = data[0].src;
                                            btn.getElementsByClassName('button-in')[0].innerText = 'Удалить фото из комментария';
                                        }}
                                    >
                                        Добавить фото к комментарию
                                    </Button>
                                </div>
                                <div className='block'>
                                    <h2>
                                        Источник
                                    </h2>
                                    <Input
                                        data-key={data_keys.copyright}
                                        placeholder='Если источник не нужен, оставьте поле пустым'
                                    />
                                </div>
                                <div className='block block-checkbox'>
                                    <Checkbox
                                        data-key={data_keys.auto_edit}
                                        id={`checkbox-auto_edit`}
                                        onChange={e => {
                                            this.selectAutoEdit(e.target.checked);
                                        }}
                                    />
                                    <h2>
                                        <label htmlFor={`checkbox-auto_edit`}>Нужна замена поста</label>
                                    </h2>
                                </div>

                                <div className='edit-data block-auto_edit'>
                                    <div className='block block-auto_edit'>
                                        <span className='block block-checkbox'>
                                            <Checkbox
                                                defaultChecked
                                                data-key={data_keys.change_text}
                                                id={`checkbox-change_text`}
                                                onChange={e => {
                                                    this.selectAutoEditKey(e.target.dataset.key, e.target.checked);
                                                }}
                                            />
                                            <h2>
                                                <label htmlFor={`checkbox-change_text`}>Текст поста <span
                                                    className='hint'>0/10 000 символов</span></label>
                                            </h2>
                                        </span>
                                        <Textarea
                                            className={data_keys.change_text}
                                            data-key={data_keys.auto_edit_keys.message}
                                            maxlength={10000}
                                            onChange={(e) => {
                                                this['div-edit'].getElementsByClassName('block-auto_edit')[0].getElementsByClassName('hint')[0].innerText = `${e.target.value.length}/10 000 символов`;
                                            }}
                                            placeholder='Это мог быть чудесный пост с прекрасными вложениями.'
                                            onPasteFile={e =>
                                                this.inputAttachPostImage2.props.onChange(e)
                                            }
                                        />
                                    </div>
                                    <div className='block block-auto_edit block-attachment'>
                                        <div className='flex flex-stretch'>
                                            <div className='block'>
                                                <span className='block block-checkbox'>
                                                    <Checkbox
                                                        defaultChecked
                                                        data-key={data_keys.change_attachments}
                                                        id={`checkbox-change_attachments`}
                                                        onChange={e => {
                                                            this.selectAutoEditKey(e.target.dataset.key, e.target.checked);
                                                        }}
                                                    />
                                                    <h2>
                                                        <label htmlFor={`checkbox-change_attachments`}>
                                                            Вложения <span className='hint'>Фото (JPG, PNG, GIF), Видео (AVI, MP3, MP4, MPEG, MOV)</span>
                                                        </label>
                                                    </h2>
                                                </span>
                                                <Input
                                                    className={data_keys.change_attachments}
                                                    data-key={data_keys.auto_edit_keys.attachments}
                                                    placeholder='Ссылки на вложения через запятую. Пример: video-208964042_456239077'
                                                    onPasteFile={e =>
                                                        this.inputAttachPostImage2.props.onChange(e)
                                                    }
                                                />
                                            </div>
                                            <div className={`block ${data_keys.change_attachments}`}>
                                                <h2>
                                                    Способ отображения вложений
                                                </h2>
                                                <Select
                                                    data-key={data_keys.auto_edit_keys.primary_attachments_mode}
                                                    options={[
                                                        {
                                                            label: 'Сетка',
                                                            value: 'grid'
                                                        },
                                                        {
                                                            label: 'Карусель',
                                                            value: 'carousel'
                                                        },
                                                    ]}
                                                />
                                            </div>
                                        </div>
                                        <div className={`flex ${data_keys.change_attachments}`}>
                                            <Button
                                                ref={ref => this.inputAttachPostImage2 = ref}
                                                type='file'
                                                multiple={true}
                                                mode='icon'
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
                                                        this[`div-edit-grid2`].appendChild(block);
                                                    }
                                                }}
                                            >
                                                <IconPhoto/>
                                            </Button>
                                            <Button
                                                type='file'
                                                multiple={true}
                                                mode='icon'
                                                onChange={async (e) => {
                                                    const data = await onFileChange(e, 'video');
                                                    for (const file of data) {
                                                        const block = document.createElement('div');

                                                        const video = document.createElement('video');
                                                        video.alt = 'video';
                                                        video.src = file.src;
                                                        block.appendChild(video);

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
                                                        this[`div-edit-grid2`].appendChild(block);
                                                    }
                                                }}
                                            >
                                                <IconVideo/>
                                            </Button>
                                        </div>
                                        <div
                                            className={`block block-auto_edit grid ${data_keys.change_attachments}`}
                                            ref={ref => this[`div-edit-grid2`] = ref}/>
                                    </div>
                                    <div className='block block-auto_edit'>
                                        <span className='block block-checkbox'>
                                            <Checkbox
                                                defaultChecked
                                                data-key={data_keys.change_comment}
                                                id={`checkbox-change_comment`}
                                                onChange={e => {
                                                    this.selectAutoEditKey(e.target.dataset.key, e.target.checked);
                                                }}
                                            />
                                            <h2>
                                                <label htmlFor={`checkbox-change_comment`}>
                                                    Первый комментарий
                                                </label>
                                            </h2>
                                        </span>
                                        <Textarea
                                            className={data_keys.change_comment}
                                            data-key={data_keys.auto_edit_keys.comment}
                                            placeholder='Тут кажется спряталась реклама... а может и нет...'
                                            onPasteFile={e =>
                                                this.inputAttachCommentImage2.props.onChange(e)
                                            }
                                        />
                                        <Button
                                            ref={ref => this.inputAttachCommentImage2 = ref}
                                            className={`photo-comment2 ${data_keys.change_comment}`}
                                            type='file'
                                            multiple={true}
                                            before={<IconPhoto/>}
                                            size='l'
                                            mode='secondary'
                                            data-src={''}
                                            onClick={(e) => {
                                                const btn = this[`div-edit`].getElementsByClassName('photo-comment2')[0];
                                                if (btn.getElementsByClassName('button-in')[0].innerText === 'Удалить фото из комментария') {
                                                    btn.dataset.src = '';
                                                    btn.getElementsByClassName('button-in')[0].innerText = 'Добавить фото к комментарию';
                                                    e.preventDefault();
                                                }
                                            }}
                                            onChange={async (e) => {
                                                const data = await onFileChange(e, 'image');
                                                if (data.length === 0) return;
                                                const btn = this[`div-edit`].getElementsByClassName('photo-comment2')[0];
                                                btn.dataset.src = data[0].src;
                                                btn.getElementsByClassName('button-in')[0].innerText = 'Удалить фото из комментария';
                                            }}
                                        >
                                            Добавить фото к комментарию
                                        </Button>
                                    </div>
                                    <div className='block block-auto_edit'>
                                        <span className='block block-checkbox'>
                                            <Checkbox
                                                defaultChecked
                                                data-key={data_keys.change_copyright}
                                                id={`checkbox-change_copyright`}
                                                onChange={e => {
                                                    this.selectAutoEditKey(e.target.dataset.key, e.target.checked);
                                                }}
                                            />
                                            <h2>
                                                <label htmlFor={`checkbox-change_copyright`}>
                                                    Источник
                                                </label>
                                            </h2>
                                        </span>
                                        <Input
                                            className={data_keys.change_copyright}
                                            data-key={data_keys.copyright2}
                                            placeholder='Если источник не нужен, оставьте поле пустым'
                                        />
                                    </div>
                                </div>
                                <div className='flex flex-stretch'>
                                    <div className='block'>
                                        <div>
                                            <span className='text text-header text-header-input'>
                                                Дата публикации
                                            </span>
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
                                    </div>
                                    <div className='block block-auto_edit'>
                                        <div>
                                            <span className='text text-header text-header-input'>
                                                Замена поста
                                            </span>
                                            <DateInput
                                                className='DateInput__with_title'
                                                value={this.state[data_keys.auto_edit_keys.time]}
                                                onChange={e => this.setState({[data_keys.auto_edit_keys.time]: e})}
                                                enableTime={true}
                                                disablePast={true}
                                                disableFuture={false}
                                                closeOnChange={true}
                                                disablePickers={true}
                                                showNeighboringMonth={true}
                                                disableCalendar={false}
                                            />
                                        </div>
                                    </div>
                                    <div className='block'>
                                        <div>
                                            <span className='text text-header text-header-input'>
                                                Удаление поста
                                            </span>
                                            <DateInput
                                                className='DateInput__with_title'
                                                value={this.state[data_keys.auto_remove]}
                                                onChange={e => this.setState({[data_keys.auto_remove]: e})}
                                                enableTime={true}
                                                disablePast={true}
                                                disableFuture={false}
                                                closeOnChange={true}
                                                disablePickers={true}
                                                showNeighboringMonth={true}
                                                disableCalendar={false}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className='block'>
                                    <h2>
                                        Интервал между выходом постов (в минутах)
                                    </h2>
                                    <Input
                                        data-key={data_keys.interval}
                                        placeholder='Если интервал не нужен, оставьте поле пустым'
                                    />
                                </div>
                                <div className='block'>
                                    <span className='block block-checkbox'>
                                        <Checkbox
                                            defaultChecked
                                            data-key={data_keys.need_spm}
                                            id={`checkbox-need_spm`}
                                            onChange={e => {
                                                this.selectAutoEditKey(e.target.dataset.key, e.target.checked);
                                            }}
                                        />
                                        <h2>
                                            <label htmlFor={`checkbox-need_spm`}>
                                                Посчитать СПМ
                                            </label>
                                        </h2>
                                    </span>
                                    <div className={`flex flex-stretch ${data_keys.need_spm}`}>
                                        <Input
                                            data-key={data_keys.spm_time}
                                            title='Через какое время'
                                            defaultValue='48ч'
                                            placeholder='Например: 48ч'
                                        />
                                        <Input
                                            data-key={data_keys.spm_value}
                                            title='Значение'
                                            defaultValue='25'
                                            placeholder='Стоимость за тысячу просмотров'
                                        />
                                    </div>
                                </div>
                                <div className='block'>
                                    <span className='block block-checkbox'>
                                        <Checkbox
                                            defaultChecked
                                            data-key={data_keys.enable_cheat}
                                            id={`checkbox-enable_cheat`}
                                        />
                                        <h2>
                                            <label htmlFor={`checkbox-enable_cheat`}>
                                                Запостить с накруткой
                                            </label>
                                        </h2>
                                    </span>
                                    <label htmlFor={`checkbox-enable_cheat`}>
                                        <span className='hint'>
                                            Если настроена накрутка, то она будет активирована для этих постов
                                        </span>
                                    </label>
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
                                                    console.log(data);
                                                    const keys = ['img1', 'img2', 'video1', 'video2', 'comment_img', 'comment_img2'];
                                                    const keys_data = {};
                                                    keys.forEach(key => {
                                                        keys_data[key] = data[key];
                                                        delete data[key];
                                                    });

                                                    const body = new FormData();
                                                    let need_upload = false;
                                                    let i = 0;
                                                    for (const key of keys) {
                                                        const type = key.includes('img') ? 'photo' : 'video_file';
                                                        for (const file of keys_data[key]) {
                                                            need_upload = true;
                                                            console.log(`Append file, key = ${key}, type = ${type}`);
                                                            body.append(`${key}-${type}-${i}`, await getBlob(file), file.split('/')[1].split(';')[0]);
                                                            i++;
                                                        }
                                                    }
                                                    console.log(keys_data);

                                                    data.need_upload = need_upload;
                                                    data._method = 'POST';

                                                    const id = await main.api('poster.startStandart', data, true);
                                                    const poster_tasks = getLocalStorageData('poster_tasks', []);
                                                    poster_tasks.push(id);
                                                    setLocalStorageData('poster_tasks', poster_tasks);

                                                    if (need_upload) {
                                                        main.apiPost('uploadPoster', {id}, body);
                                                    }
                                                    main.setPopout(null);
                                                    await this.setState({_refresh: false});
                                                    this.setState({_refresh: true});
                                                    this.componentDidMount();
                                                    main.setState({activeLeftTab: 4});
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