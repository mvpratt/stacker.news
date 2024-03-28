import { useState } from 'react'
import { Dropdown, Image, Nav, Navbar, Offcanvas } from 'react-bootstrap'
import { MEDIA_URL } from '@/lib/constants'
import Link from 'next/link'
import { useServiceWorker } from '@/components/serviceworker'
import { signOut } from 'next-auth/react'
import { LoginButtons, NavWalletSummary } from '../common'
import AnonIcon from '@/svgs/spy-fill.svg'
import styles from './footer.module.css'
import classNames from 'classnames'

export default function OffCanvas ({ me, dropNavKey }) {
  const [show, setShow] = useState(false)

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)
  const { registration: swRegistration, togglePushSubscription } = useServiceWorker()

  const MeImage = ({ onClick }) => me
    ? (
      <Image
        src={me?.photoId ? `${MEDIA_URL}/${me.photoId}` : '/dorian400.jpg'} width='28' height='28'
        style={{ clipPath: 'polygon(0 0, 83% 0, 100% 100%, 17% 100%)' }}
        onClick={onClick}
      />
      )
    : <span className='text-muted'><AnonIcon onClick={onClick} width='22' height='22' /></span>

  return (
    <>
      <MeImage onClick={handleShow} />

      <Offcanvas style={{ maxWidth: '250px', zIndex: '10000' }} show={show} onHide={handleClose} placement='start'>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title><NavWalletSummary /></Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className='pb-0'>
          <div style={{
            '--bs-dropdown-item-padding-y': '.5rem',
            '--bs-dropdown-item-padding-x': 0,
            '--bs-dropdown-divider-bg': '#ced4da',
            '--bs-dropdown-divider-margin-y': '0.5rem',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          >
            {me
              ? (
                <>
                  <Link href={'/' + me.name} passHref legacyBehavior>
                    <Dropdown.Item active={me.name === dropNavKey}>
                      profile
                      {me && !me.bioId &&
                        <div className='p-1 d-inline-block bg-secondary ms-1'>
                          <span className='invisible'>{' '}</span>
                        </div>}
                    </Dropdown.Item>
                  </Link>
                  <Link href={'/' + me.name + '/bookmarks'} passHref legacyBehavior>
                    <Dropdown.Item active={me.name + '/bookmarks' === dropNavKey}>bookmarks</Dropdown.Item>
                  </Link>
                  <Link href='/wallet' passHref legacyBehavior>
                    <Dropdown.Item eventKey='wallet'>wallet</Dropdown.Item>
                  </Link>
                  <Link href='/satistics?inc=invoice,withdrawal,stacked,spent' passHref legacyBehavior>
                    <Dropdown.Item eventKey='satistics'>satistics</Dropdown.Item>
                  </Link>
                  <Dropdown.Divider />
                  <Link href='/referrals/month' passHref legacyBehavior>
                    <Dropdown.Item eventKey='referrals'>referrals</Dropdown.Item>
                  </Link>
                  <Dropdown.Divider />
                  <div className='d-flex align-items-center'>
                    <Link href='/settings' passHref legacyBehavior>
                      <Dropdown.Item eventKey='settings'>settings</Dropdown.Item>
                    </Link>
                  </div>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={async () => {
                      try {
                        // order is important because we need to be logged in to delete push subscription on server
                        const pushSubscription = await swRegistration?.pushManager.getSubscription()
                        if (pushSubscription) {
                          await togglePushSubscription()
                        }
                      } catch (err) {
                        // don't prevent signout because of an unsubscription error
                        console.error(err)
                      }
                      await signOut({ callbackUrl: '/' })
                    }}
                  >logout
                  </Dropdown.Item>
                </>
                )
              : <LoginButtons />}
            <div className={classNames(styles.footerPadding, 'mt-auto')}>
              <Navbar className={classNames('container d-flex flex-row px-0 text-muted')}>
                <Nav>
                  <Link href={`/${me?.name || 'anon'}`} className='d-flex flex-row p-2 mt-auto text-muted'>
                    <MeImage />
                    <div className='ms-2'>
                      @{me?.name || 'anon'}
                    </div>
                  </Link>
                </Nav>
              </Navbar>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}
