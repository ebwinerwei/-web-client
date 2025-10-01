import React, { useEffect, useState, useRef } from "react";
import { manageLogin, getAccountList, deleteAccountList, createAccount, updateAccount } from '@/services/ant-design-pro/api';
import { message, Input, Select, Button, Table, Popconfirm } from 'antd'
import dayjs from 'dayjs';
import LoginModal from './jsx/loginModal'
import AddUpdateModal from './jsx/addUpdateModal'
import './index.scss'

function View() {
  const [loginModalVisible, setLoginVisibleModal] = useState(false)
  const [addUpdateModalVisible, setAddUpdateModalVisible] = useState(false)
  const columns = useRef([
    {
      title: '账户id',
      dataIndex: 'accountId',
      key: 'accountId',
    },
    {
      title: '账户名称',
      dataIndex: 'accountNo',
      key: 'accountNo',
    },
    {
      title: '账户密码',
      dataIndex: 'password',
      key: 'password',
    },
    {
      title: '公司名称',
      key: 'remark',
      dataIndex: 'remark',
    },
    {
      title: '创建日期',
      key: 'createTime',
      dataIndex: 'createTime',
      render: (val) => {
        return val ? dayjs(val).format('YYYY-MM-DD') : ''
      }
    },
    {
      title: '账户有效期',
      key: 'vipValidTime',
      dataIndex: 'vipValidTime',
      render: (val) => {
        return val ? dayjs(val).format('YYYY-MM-DD') : ''
      }
    },
    {
      title: '账户类型',
      key: 'channelNo',
      dataIndex: 'channelNo',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => {
            setAddUpdateModalVisible(true)
            setUpdateInfo(record)}
          }>修改</Button>
          <Popconfirm
            title="删除"
            description="确认删除该账户吗？"
            onConfirm={() => {
              confirmDelete(record)
            }}
            okText="确认"
            cancelText="取消"
          >
            <Button danger type="link">删除</Button>
          </Popconfirm>
        </>
      ),
    },
  ])
  const [searchInfo, setSearchInfo] = useState({
    accountNo: '',
    remark: '',
    channelNo: '',
    pageNo: 1,
    pageSize: 10,
    loading: false
  })
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [updateInfo, setUpdateInfo] = useState({})

  const confirmDelete = async(record) => {
    const res = await deleteAccountList({ accountId: record.accountId })
    if (res?.error?.errorCode == 0) {
      message.success(t('削除しました'))
      getTableData({ current: 1 })
    } else {
      message.error(res?.error?.errorMsg)
      if (res?.error?.errorCode == 1001) {
        localStorage.removeItem('mangeUserInfo');
        judgeLoginStatus()
      }
    }
  }

  const getTableData = async(pagination) => {
    setSearchInfo({
      ...searchInfo,
      loading: true
    })
    const res = await getAccountList({
      ...searchInfo,
      pageNo: pagination.current || searchInfo.pageNo,
      pageSize: pagination.pageSize || searchInfo.pageSize
    })
    if (res?.error?.errorCode == 0) {
      setData(res.data?.records || [])
      setTotal(res.data?.total || 0)
    } else {
      message.error(res?.error?.errorMsg || '查询失败')
      if (res?.error?.errorCode == 1001) {
        localStorage.removeItem('mangeUserInfo');
        judgeLoginStatus()
      }
    }
    setSearchInfo({
      ...searchInfo,
      pageNo: res.data.current,
      pageSize: res.data.size,
      loading: false
    })
  }

  const manageLoginOpt = async (params) => {
    const res = await manageLogin(params);
    if (res?.error?.errorCode == '0') {
      setLoginVisibleModal(false)
      message.success('登录成功');
      localStorage.setItem('mangeUserInfo', res.data);
      getTableData({ current: 1 })
    } else {
      message.error(res?.error?.errorMsg || '登录失败');
      localStorage.setItem('mangeUserInfo', '');
    }
  }

  const judgeLoginStatus = () => {
    const userInfo = localStorage.getItem('mangeUserInfo');
    if (!userInfo) {
      setLoginVisibleModal(true)
      return
    } else {
      getTableData({ current: 1 })
    }
  }

  const handleChange = (pagination) => {
    setSearchInfo({
      ...searchInfo,
      pageNo: pagination.current,
      pageSize: pagination.pageSize
    })
    getTableData(pagination)
  };

  const addUpdateOpt = async(obj) => {
    const req = updateInfo.accountId ? updateAccount : createAccount
    const res = await req({ ...obj, accountId: updateInfo.accountId })
    if (res?.error?.errorCode == 0) {
      message.success(updateInfo.accountId ? '修改成功' : '创建成功')
      getTableData({ current: 1 })
      setAddUpdateModalVisible(false)
      setUpdateInfo({})
    } else {
      message.error(res?.error?.errorMsg)
      if (res?.error?.errorCode == 1001) {
        localStorage.removeItem('mangeUserInfo');
        judgeLoginStatus()
      }
    }
  }

  useEffect(() => {
    judgeLoginStatus()
  }, [])

  return (
    <div>
      <div className="mange-list-content">
        <div className="title">Ai渲染后台管理</div>
        <div className="search-opt">
          <div className="search-det">
            <span className="label">账户名称</span>
            <Input onChange={(e) => setSearchInfo({ ...searchInfo, accountNo: e.target.value })} placeholder="请输入账户名称" style={{ width: 200 }} />
          </div>
          <div className="search-det">
            <span className="label">公司名称</span>
            <Input onChange={(e) => setSearchInfo({ ...searchInfo, remark: e.target.value })} placeholder="请输入公司名称" style={{ width: 200 }} />
          </div>
          <div className="search-det">
            <span className="label">账号类型</span>
            <Select
              style={{ width: 200 }}
              onChange={(v) => setSearchInfo({ ...searchInfo, channelNo: v })}
              placeholder="请选择账号类型"
            >
              {[{ id: 'client', name: '客户端' }, { id: 'web', name: '网页端' }].map((v) => {
                return (
                  <Select.Option key={v.id} value={v.id}>
                    {v.name}
                  </Select.Option>
                );
              })}
            </Select>
          </div>
          <div className="search-det">
            <Button onClick={() => getTableData({ current: 1 })}>查询</Button>
          </div>
        </div>
        <div className="opts">
          <Button type="primary" onClick={() => setAddUpdateModalVisible(true)}>新建账户</Button>
        </div>
        <Table
          columns={columns.current}
          dataSource={data}
          loading={searchInfo.loading}
          rowKey={(record) => record.accountId}
          onChange={handleChange}
          pagination={{
            current: searchInfo.pageNo,
            pageSize: searchInfo.pageSize,
            total
          }}
        />
      </div>
      <LoginModal
        loginModalVisible={loginModalVisible}
        setLoginVisibleModal={setLoginVisibleModal}
        manageLoginOpt={manageLoginOpt}
      />
      {
        addUpdateModalVisible && <AddUpdateModal
          addUpdateModalVisible={addUpdateModalVisible}
          setAddUpdateModalVisible={setAddUpdateModalVisible}
          addUpdateOpt={addUpdateOpt}
          updateInfo={updateInfo}
        />
      }
    </div>
  )
}
export default View
