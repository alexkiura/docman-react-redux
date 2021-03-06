import md5 from 'blueimp-md5';

import React, { PropTypes } from 'react';

import {
  Card, CardHeader, CardMedia, CardTitle
} from 'material-ui/Card';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';

const UserSidebar = (props) => {
  const user = props.userDetails.user;
  const userGravatar =
    `https://www.gravatar.com/avatar/${user ? md5(user.email) : ''}?d=identicon`;

  return (
    <div className='sidebar'>
      <Card className='sidebar-card'>
        <CardHeader
          avatar={`${userGravatar}&s=40`}
          subtitle={user && user.role && user.role.title === 'admin'
            ? user.role.title
            : `@${user.username}`
          }
          title={user.name
            ? `${user.name.firstName} ${user.name.lastName}`
            : user.username
          }
        >
          {props.isOwnProfileOrAdmin
          ?
            <IconMenu
              anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
              iconButtonElement={
                <IconButton><MoreVertIcon /></IconButton>
              }
              style={{
                position: 'absolute',
                right: '4px'
              }}
              targetOrigin={{ horizontal: 'right', vertical: 'top' }}
            >
              <MenuItem
                onTouchTap={props.handleToggleShowUpdate}
                primaryText='Edit Profile'
              />
            </IconMenu>
          : null
          }
        </CardHeader>
        <CardMedia>
          <img role='presentation' src={`${userGravatar}&s=300`} />
        </CardMedia>
        <CardTitle
          subtitle={user ? user.email : ''}
          title={user ? user.username : ''}
        />
      </Card>
    </div>
  );
};

UserSidebar.propTypes = {
  handleToggleShowUpdate: PropTypes.func.isRequired,
  isOwnProfileOrAdmin: PropTypes.bool,
  userDetails: PropTypes.shape({
    user: PropTypes.shape({
      email: PropTypes.string.isRequired,
      role: PropTypes.shape({
        accessLevel: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired
      }),
      username: PropTypes.string.isRequired
    })
  }).isRequired
};

export default UserSidebar;
