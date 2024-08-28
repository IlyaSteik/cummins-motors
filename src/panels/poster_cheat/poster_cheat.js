import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './poster_cheat.css';

import Button from "../../components/button/button";
import Input, {Textarea} from "../../components/input/input";

import {ReactComponent as IconPhoto} from "../../assets/icons/photo.svg";
import {ReactComponent as IconVideo} from "../../assets/icons/video.svg";

import {
    apiUrl,
    checkErrorAuthToken, clearStringFromUrl,
    decOfNum, getBlob, getFile, getLocalStorageData, isMobile,
    multiIncludes, onFileChange, openUrl, setLocalStorageData,
    shortIntegers,
    skipMsgErrorCodes,
    sleep,
    vkApi, vkApiPost
} from "../../utils/utils";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";
import Checkbox from "../../components/checkbox/checkbox";
import {ScreenSpinner, DateInput, Spinner} from "@vkontakte/vkui";
import {ReactComponent as IconSearch} from "../../assets/icons/search.svg";
import {ReactComponent as IconAddSquare} from "../../assets/icons/add_square.svg";
import {ReactComponent as IconRemove} from "../../assets/icons/remove.svg";
import {ReactComponent as IconChevron} from "../../assets/icons/chevron_down.svg";
import {ReactComponent as IconPlay} from "../../assets/icons/play.svg";
import {ReactComponent as IconPause} from "../../assets/icons/pause.svg";
import {ReactComponent as IconEdit} from "../../assets/icons/edit.svg";

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            searchText: ''
        }

        this.componentDidMount = this.componentDidMount.bind(this);
        this.onSearch = this.onSearch.bind(this);
        this.renderCheatRow = this.renderCheatRow.bind(this);
        this.renderCheatEditRow = this.renderCheatEditRow.bind(this);
    }

    async componentDidMount() {

    }

    get data_keys() {
        const rows = [
            ['Обычные лайки', 'likes', 'likes_interval'],
            ['Лайки от подписчиков', 'likes_sub', 'likes_sub_interval'],
            ['Комментарии', 'comments', 'comments_interval'],
            ['AI комментарии', 'comments_ai', 'comments_ai_interval'],
            ['Репосты', 'reposts', 'reposts_interval'],
            ['Репосты в ЛС', 'reposts_message', 'reposts_message_interval']
        ]
        return isMobile() ? new Array(rows.length).fill(0).map((v, i) => rows.slice(i, i + 1)) : [
            rows.slice(0, 3),
            rows.slice(3, 6)
        ];
    }

    onSearch(e) {
        this.setState({[e.target.dataset.key]: e.target.value});
    }

    async changeEditMode(id) {
        if (id === -1) {
            const isHide = this[`div-edit_${id}`].style.display === 'flex';
            if (isHide) {
                this[`div-view_${id}`].style.display = 'flex';
                this[`div-edit_${id}`].style.display = 'none';
            } else {
                this[`div-view_${id}`].style.display = 'none';
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

    renderCheatEditRow(cheat, index) {
        const {main} = this.props;
        const {poster_groups_data} = main.state;
        const {id, group_id} = cheat;

        const getInputFieldsData = () => {
            const data = {id, group_id: null};
            [...this[`div-edit_${index === -1 ? index : id}`].getElementsByTagName('input')].filter(v => v.dataset.key).forEach(input =>
                data[input.dataset.key] = input.type === 'checkbox' ? input.checked : input.value
            );

            return data;
        };

        return <div
            className='edit-data'
            ref={ref => this[`div-edit_${index === -1 ? index : id}`] = ref}
            style={{display: 'none'}}
        >
            <h2 style={{marginBottom: -24}}>
                <span className='right'>
                    <IconCancel onClick={() => this.changeEditMode(index === -1 ? index : 0)}
                                ref={ref => this.cancelButton = ref}/>
                </span>
            </h2>
            {
                this.data_keys.map((v1, i1) =>
                    <div className='block' key={`block-${i1}`}>
                        <div className='flex flex-stretch'>
                            {
                                v1.map((v, i) =>
                                    <div className='block' key={`sub-block-${i}`}>
                                        <h2>{v[0]}</h2>
                                        <div className='flex flex-stretch'>
                                            <Input
                                                title='Количество'
                                                placeholder='5000'
                                                defaultValue={cheat[v[1]]}
                                                data-key={v[1]}
                                            />
                                            <Input
                                                title='Интервал'
                                                placeholder='25'
                                                defaultValue={cheat[v[2]]}
                                                data-key={v[2]}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }

            <div className='block'>
                <div className='flex flex-stretch'>
                    <Button
                        size='l'
                        onClick={async () => {
                            try {
                                const data = getInputFieldsData();
                                console.log({data});
                                const req = await main.api('cheats.edit', data, true);
                                console.log({req});
                                this.changeEditMode(0);
                                await main.updateCheats(true);
                            } catch (e) {
                                main.error(e);
                            }
                        }}
                    >
                        Сохранить
                    </Button>
                </div>
            </div>
        </div>
    }

    renderCheatRow(cheat, index) {
        const {main} = this.props;
        const {poster_groups_data} = main.state;
        const {id, group_id, active} = cheat;
        const group = poster_groups_data && poster_groups_data.find(value => group_id === value.group_id);

        return <React.Fragment key={`row-${index}`}>
            <div ref={ref => this[`div-view_${index === -1 ? index : id}`] = ref}>
                <span className='number' style={{visibility: index === -1 && 'hidden'}}>{index + 1}</span>
                <span className='text'>{group ? group.name : 'Общая накрутка'}</span>
                <span className='actions'>
                    <Button
                        size='l'
                        after={<IconChevron/>}
                        mode='secondary'
                        onClick={() => this.changeDetailsMode(index === -1 ? index : id)}
                    >
                        Настройки
                    </Button>
                    <Button
                        className={`action-pp-${id}`}
                        size='l'
                        before={!active ? <IconPlay/> : <IconPause/>}
                        mode={!active ? 'secondary' : 'primary'}
                        onClick={async () => {
                            cheat.active = !active;
                            await main.api('cheats.setStatus', {id, status: cheat.active}, true);
                            await main.updateCheats(cheat);
                        }}
                    >
                        {
                            active ? 'Выключить' : 'Включить'
                        }
                    </Button>
                    <IconEdit className='button-edit' onClick={() => this.changeEditMode(index === -1 ? index : id)}/>
                </span>
                <div
                    className='bottom-details'
                    ref={ref => this[`div-view-details_${index === -1 ? index : id}`] = ref}
                    style={{display: 'none'}}
                >
                    {
                        this.data_keys.map((v1, i1) =>
                            <div className='flex flex-stretch' key={`block-${i1}`}>
                                {
                                    v1.map((v, i) =>
                                        <div className='block' key={`data-${i}`}>
                                            <span className='text text-header'>{v[0]}</span>
                                            <span className='text'>{shortIntegers(cheat[v[1]])} / {cheat[v[2]]}</span>
                                        </div>
                                    )
                                }
                            </div>
                        )
                    }
                </div>
            </div>
            {this.renderCheatEditRow(cheat, index)}
        </React.Fragment>;
    }

    render() {
        const {main, style} = this.props;
        const {poster_groups_data, cheats_data} = main.state;
        let {searchText} = this.state;

        return (
            <div className='content-in content-poster-cheats' style={style}>
                <h1>Глобальная настройка</h1>
                <h2>Ваш токен из <a href='https://z1y1x1.ru' target='_blank'>z1y1x1</a></h2>
                <Input
                    placeholder='Введите токен здесь'
                    defaultValue={main.state.user_data && main.state.user_data.cheat_token}
                    onChange={e => {
                        if (this._timeout) clearTimeout(this._timeout);

                        this._timeout = setTimeout(async () => {
                            try {
                                const token = e.target.value;
                                main.setPopout(<ScreenSpinner/>);
                                const data = await main.api('cheats.setToken', {token});
                                main.setPopout(null);
                                if (data.error) {
                                    main.error(data);
                                } else {
                                    if (data.money) {
                                        main.setState({user_data: {...main.state.user_data, cheat_token: token}});
                                        main.setAlert('Токен сохранен', `Получили данные, баланс = ${data.money}`);
                                    } else {
                                        main.setAlert('Токен сохранен', `Вы удалили токен.`);
                                    }
                                }
                            } catch (e) {
                                main.error(e);
                            }
                        }, 1000)
                    }}
                />
                <div className='table'>
                    <div className='table-in'>
                        {
                            poster_groups_data && Array.isArray(poster_groups_data) && cheats_data && Array.isArray(cheats_data) &&
                            this.renderCheatRow(cheats_data.find(value => value.group_id === 0), -1)
                        }
                    </div>
                </div>
                <h1 style={{marginTop: 24}}>Настройка групп</h1>
                <div className='table'>
                    <div className='table-header'>
                        <span>№</span>
                        <span>Название сообщества</span>
                    </div>
                    <div className='table-in'>
                        {
                            poster_groups_data && Array.isArray(poster_groups_data) && cheats_data && Array.isArray(cheats_data) && cheats_data
                                .filter(value => value.group_id > 0)
                                .sort((a, b) => a.id - b.id)
                                .map(this.renderCheatRow)
                        }
                        {
                            !(poster_groups_data && cheats_data) &&
                            <Spinner size='medium'/>
                        }
                    </div>
                </div>
            </div>
        );
    }
}