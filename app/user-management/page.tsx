import PageHeader from '../components/common/PageHeader';
import UserList from '../components/UserList';

const UserManagement = () => {
  return (
    <>
      <PageHeader
        title="계정 관리"
        description="계정을 등록하고 관리할 수 있습니다."
      />
      <div className="flex-grow">
        <UserList />
      </div>
    </>
  );
};

export default UserManagement;
