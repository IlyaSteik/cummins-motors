import React, {PureComponent} from "react";
import './groups.css';

import Input from "../../components/input/input";
import Button from "../../components/button/button";

import {ReactComponent as IconSearch} from "../../assets/icons/search.svg";
import {ReactComponent as IconAddSquare} from "../../assets/icons/add_square.svg";
import {ReactComponent as IconUpdate} from "../../assets/icons/update.svg";
import {ReactComponent as IconEdit} from "../../assets/icons/edit.svg";
import {ReactComponent as IconRemove} from "../../assets/icons/remove.svg";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";

import {api, getTokenFromStr, shortIntegers, sleep} from "../../utils/utils";
import {ScreenSpinner, Spinner} from "@vkontakte/vkui";

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            searchText: ''
        }

        this.onSearch = this.onSearch.bind(this);
        this.renderGroupRow = this.renderGroupRow.bind(this);
        this.renderGroupEditRow = this.renderGroupEditRow.bind(this);
    }

    onSearch(e) {
        this.setState({[e.target.dataset.key]: e.target.value});
    }

    async changeEditMode(id) {
        //console.log(`change edit mode ${id}`);
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

    renderGroupEditRow({
                           access_token,
                           access_token_admin,
                           dialogs,
                           group_id,
                           name,
                           screen_name,
                           photo_100,
                           proxy
                       }, index) {
        const {main} = this.props;

        const getInputFieldsData = () => {
            const data = {};
            [...this[`div-edit_${group_id}`].getElementsByTagName('input')].forEach(input =>
                data[input.dataset.key] = input.value
            );
            if (data.token) {
                data.token = getTokenFromStr(data.token);
            }
            return data;
        }
        const data_keys = ['name', 'group_url', 'token', 'proxy', 'token_admin'];

        return <div
            className='edit-data'
            ref={ref => this[`div-edit_${group_id}`] = ref}
            style={{display: 'none'}}
        >
            <h2>
                {index === -1 ? 'Введите данные вашего сообщества' : 'Редактирование данных сообщества'}
                <span className='right'>
                    <IconCancel onClick={() => this.changeEditMode(index === -1 ? index : 0)}/>
                    {index !== -1 && <IconRemove onClick={async () => {
                        main.setPopout(<ScreenSpinner/>);
                        await main.api('groups.remove', {group_id, type: 3}, true);
                        await main.updateMailingGroups();
                        main.setPopout(null);
                    }}/>}
                </span>
            </h2>
            {false &&
                <Input
                    data-key={data_keys[0]}
                    placeholder='Введите название сообщества'
                    defaultValue={name}
                />
            }
            <div className='flex flex-stretch'>
                {false &&
                    <Input
                        data-key={data_keys[1]}
                        title='Ссылка на сообщество'
                        defaultValue={index !== -1 ? `https://vk.com/${screen_name}` : ''}
                    />
                }
                <Input
                    data-key={data_keys[2]}
                    title='Токен сообщества'
                    defaultValue={access_token}
                />
                {
                    false &&
                    <Input
                        data-key={data_keys[4]}
                        title='Токен админа'
                        defaultValue={access_token_admin}
                    />
                }
                <Input
                    data-key={data_keys[3]}
                    title='Прокси для рассылок'
                    placeholder='Необязательное поле (login:password@ip:port)'
                    defaultValue={proxy}
                />
                {
                    index === -1 ?
                        <Button
                            size='l'
                            onClick={async () => {
                                try {
                                    const data = getInputFieldsData();
                                    console.log({data});
                                    const req = await main.api('groups.add', {type: 3, ...data}, true);
                                    console.log({req});
                                    this.changeEditMode(-1);
                                    main.updateMailingGroups();
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
                                    main.setPopout(<ScreenSpinner/>);
                                    const req = await main.api('groups.edit', {group_id, type: 3, ...data}, true);
                                    main.setPopout(null);
                                    console.log({req});
                                    this.changeEditMode(0);
                                    main.updateMailingGroups();
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
    }

    renderGroupRow({
                       access_token,
                       access_token_admin,
                       dialogs,
                       group_id,
                       name,
                       screen_name,
                       photo_100,
                       proxy,
                       base
                   }, index) {
        const {main} = this.props;

        return <React.Fragment key={`row-${index}`}>
            <div ref={ref => this[`div-view_${group_id}`] = ref}
                 className={name === undefined || name === null ? 'error' : ''}>
                <img className='icon' alt='icon' src={photo_100}/>
                <span className='number'>{index + 1}</span>
                <span className='text'>{name}</span>
                <span className='text text-flex'>
                    <IconUpdate style={{display: 'none'}}/> Диалогов доступно: {shortIntegers(dialogs)}
                </span>
                <span className='text text-url'
                      onClick={() => open(`https://vk.com/${screen_name}`)}>@{screen_name}</span>
                <span className='actions'>
                    <IconEdit onClick={() => this.changeEditMode(group_id)}/>
                    <IconUpdate onClick={async () => {
                        const status = (await main.api('groups.getUpdateBaseStatus', {key: group_id})).response;
                        if (status && !status.end) {
                            if (status.err) {
                                main.error(status.err);
                            } else if (status.status) {
                                main.setAlert('Обновление в процессе', `Статус обновления: ${status.status}`, [{
                                    title: 'Ок',
                                    autoclose: true
                                }]);
                            }
                        } else {
                            main.setAlert('Обновление базы', `Вы уверены, что хотите обновить базу?`, [
                                {
                                    title: 'Да',
                                    autoclose: true,
                                    action: async () => {
                                        //main.setPopout(<ScreenSpinner/>);
                                        try {
                                            await main.api('groups.updateBase', {group_id, type: 3}, true);
                                            await main.updateMailingGroups();
                                        } catch (e) {
                                        }
                                        //main.setPopout(null);
                                    }
                                },
                                {
                                    title: 'Нет',
                                    autoclose: true
                                },
                            ]);
                        }
                    }}/>
                    <IconRemove onClick={async () => {
                        main.setPopout(<ScreenSpinner/>);
                        await main.api('groups.remove', {group_id, type: 3}, true);
                        await main.updateMailingGroups();
                        main.setPopout(null);
                    }}/>
                </span>
            </div>
            {this.renderGroupEditRow({
                access_token,
                access_token_admin,
                dialogs,
                group_id,
                name,
                screen_name,
                photo_100,
                proxy
            }, index)}
        </React.Fragment>
    }

    render() {
        const {main, style} = this.props;
        const {searchText} = this.state;
        const {mailing_groups_data} = main.state;
        return (
            <div className='content-in content-mailing-groups' style={style}>
                <h1>Сообщества</h1>
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
                    Добавить сообщество
                </Button>
                {this.renderGroupEditRow({group_id: -1}, -1)}
                <div className='table'>
                    <div className='table-header'>
                        <span>№</span>
                        <span>Название</span>
                        <span>Кол-во диалогов</span>
                        <span>Ссылка</span>
                    </div>
                    <div className='table-in'>
                        {
                            mailing_groups_data && Array.isArray(mailing_groups_data) && mailing_groups_data.sort((a, b) => b.dialogs - a.dialogs)
                                .filter(value => searchText ? (value.name ? value.name.toLowerCase().includes(searchText.toLowerCase()) : true) : true)
                                .map(this.renderGroupRow)
                        }
                        {
                            !mailing_groups_data &&
                            <Spinner size='medium'/>
                        }
                    </div>
                </div>
            </div>
        );
    }
}