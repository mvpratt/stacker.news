import itemStyles from './item.module.css'
import styles from './comment.module.css'
import Text from './text'
import Link from 'next/link'
import Reply, { ReplyOnAnotherPage } from './reply'
import { useEffect, useMemo, useRef, useState } from 'react'
import UpVote from './upvote'
import Eye from '../svgs/eye-fill.svg'
import EyeClose from '../svgs/eye-close-line.svg'
import { useRouter } from 'next/router'
import CommentEdit from './comment-edit'
import { COMMENT_DEPTH_LIMIT, NOFOLLOW_LIMIT } from '../lib/constants'
import { ignoreClick } from '../lib/clicks'
import PayBounty from './pay-bounty'
import BountyIcon from '../svgs/bounty-bag.svg'
import ActionTooltip from './action-tooltip'
import Flag from '../svgs/flag-fill.svg'
import { abbrNum } from '../lib/format'
import Share from './share'
import ItemInfo from './item-info'
import Badge from 'react-bootstrap/Badge'
import { RootProvider, useRoot } from './root'
import { useMe } from './me'

function Parent ({ item, rootText }) {
  const root = useRoot()

  const ParentFrag = () => (
    <>
      <span> \ </span>
      <Link href={`/items/${item.parentId}`} className='text-reset'>
        parent
      </Link>
    </>
  )

  return (
    <>
      {Number(root.id) !== Number(item.parentId) && <ParentFrag />}
      <span> \ </span>
      <Link href={`/items/${root.id}`} className='text-reset'>
        {rootText || 'on:'} {root?.title}
      </Link>
      {root.subName &&
        <Link href={`/~${root.subName}`}>
          {' '}<Badge className={itemStyles.newComment} bg={null}>{root.subName}</Badge>
        </Link>}
    </>
  )
}

const truncateString = (string = '', maxLength = 140) =>
  string.length > maxLength
    ? `${string.substring(0, maxLength)} […]`
    : string

export function CommentFlat ({ item, rank, ...props }) {
  const router = useRouter()
  const [href, as] = useMemo(() => {
    if (item.path.split('.').length > COMMENT_DEPTH_LIMIT + 1) {
      return [{
        pathname: '/items/[id]',
        query: { id: item.parentId, commentId: item.id }
      }, `/items/${item.parentId}`]
    } else {
      return [{
        pathname: '/items/[id]',
        query: { id: item.root.id, commentId: item.id }
      }, `/items/${item.root.id}`]
    }
  }, [item?.id])

  return (
    <>
      {rank
        ? (
          <div className={`${itemStyles.rank} pt-2 align-self-start`}>
            {rank}
          </div>)
        : <div />}
      <div
        className='clickToContext py-2'
        onClick={e => {
          if (ignoreClick(e)) return
          router.push(href, as)
        }}
      >
        <RootProvider root={item.root}>
          <Comment item={item} {...props} />
        </RootProvider>
      </div>
    </>
  )
}

export default function Comment ({
  item, children, replyOpen, includeParent, topLevel,
  rootText, noComments, noReply, truncate, depth
}) {
  const [edit, setEdit] = useState()
  const me = useMe()
  const [collapse, setCollapse] = useState(
    !me?.wildWestMode && !me?.greeterMode &&
    !item.mine && item.freebie && item.wvotes <= 0
      ? 'yep'
      : 'nope')
  const ref = useRef(null)
  const router = useRouter()
  const root = useRoot()
  const [pendingSats, setPendingSats] = useState(0)

  useEffect(() => {
    setCollapse(window.localStorage.getItem(`commentCollapse:${item.id}`) || collapse)
    if (Number(router.query.commentId) === Number(item.id)) {
      // HACK wait for other comments to collapse if they're collapsed
      setTimeout(() => {
        ref.current.scrollIntoView({ behavior: 'instant', block: 'start' })
        ref.current.classList.add('outline-it')
        router.replace({
          pathname: router.pathname,
          query: { id: router.query.id }
        }, undefined, { scroll: false })
      }, 20)
    }
  }, [item])

  const bottomedOut = depth === COMMENT_DEPTH_LIMIT
  const op = root.user.name === item.user.name
  const bountyPaid = root.bountyPaidTo?.includes(Number(item.id))

  return (
    <div
      ref={ref} className={includeParent ? '' : `${styles.comment} ${collapse === 'yep' ? styles.collapsed : ''}`}
    >
      <div className={`${itemStyles.item} ${styles.item}`}>
        {item.meDontLike
          ? <Flag width={24} height={24} className={styles.dontLike} />
          : <UpVote item={item} className={styles.upvote} pendingSats={pendingSats} setPendingSats={setPendingSats} />}
        <div className={`${itemStyles.hunk} ${styles.hunk}`}>
          <div className='d-flex align-items-center'>
            <ItemInfo
              item={item}
              pendingSats={pendingSats}
              commentsText='replies'
              className={`${itemStyles.other} ${styles.other}`}
              embellishUser={op && <Badge bg='boost' className={`ms-1 ${styles.op} bg-opacity-75`}>OP</Badge>}
              extraInfo={
                <>
                  {includeParent && <Parent item={item} rootText={rootText} />}
                  {bountyPaid &&
                    <ActionTooltip notForm overlayText={`${abbrNum(root.bounty)} sats paid`}>
                      <BountyIcon className={`${styles.bountyIcon} ${'fill-success vertical-align-middle'}`} height={16} width={16} />
                    </ActionTooltip>}
                </>
              }
              onEdit={e => { setEdit(!edit) }}
              editText={edit ? 'cancel' : 'edit'}
            />
            {!includeParent && (collapse === 'yep'
              ? <Eye
                  className={styles.collapser} height={10} width={10} onClick={() => {
                    setCollapse('nope')
                    window.localStorage.setItem(`commentCollapse:${item.id}`, 'nope')
                  }}
                />
              : <EyeClose
                  className={styles.collapser} height={10} width={10} onClick={() => {
                    setCollapse('yep')
                    window.localStorage.setItem(`commentCollapse:${item.id}`, 'yep')
                  }}
                />)}
            {topLevel && (
              <span className='d-flex ms-auto align-items-center'>
                <Share item={item} />
              </span>
            )}
          </div>
          {edit
            ? (
              <CommentEdit
                comment={item}
                onSuccess={() => {
                  setEdit(!edit)
                }}
              />
              )
            : (
              <div className={styles.text}>
                <Text topLevel={topLevel} nofollow={item.sats + item.boost < NOFOLLOW_LIMIT}>
                  {truncate ? truncateString(item.text) : item.searchText || item.text}
                </Text>
              </div>
              )}
        </div>
      </div>
      {collapse !== 'yep' && (
        bottomedOut
          ? <DepthLimit item={item} />
          : (
            <div className={styles.children}>
              {!noReply &&
                <Reply depth={depth + 1} item={item} replyOpen={replyOpen}>
                  {root.bounty && !bountyPaid && <PayBounty item={item} />}
                </Reply>}
              {children}
              <div className={styles.comments}>
                {item.comments && !noComments
                  ? item.comments.map((item) => (
                    <Comment depth={depth + 1} key={item.id} item={item} />
                  ))
                  : null}
              </div>
            </div>
            )
      )}
    </div>
  )
}

function DepthLimit ({ item }) {
  if (item.ncomments > 0) {
    return (
      <Link href={`/items/${item.id}`} className='d-block p-3 fw-bold text-muted w-100 text-center'>
        view replies
      </Link>
    )
  }

  return (
    <div className={styles.children}>
      <ReplyOnAnotherPage parentId={item.id} />
    </div>
  )
}

export function CommentSkeleton ({ skeletonChildren }) {
  return (
    <div className={styles.comment}>
      <div className={`${itemStyles.item} ${itemStyles.skeleton} ${styles.item} ${styles.skeleton}`}>
        <UpVote className={styles.upvote} />
        <div className={`${itemStyles.hunk} ${styles.hunk}`}>
          <div className={itemStyles.other}>
            <span className={`${itemStyles.otherItem} clouds`} />
            <span className={`${itemStyles.otherItem} clouds`} />
            <span className={`${itemStyles.otherItem} clouds`} />
            <span className={`${itemStyles.otherItem} ${itemStyles.otherItemLonger} clouds`} />
          </div>
          <div className={`${styles.text} clouds`} />
        </div>
      </div>
      <div className={`${itemStyles.children} ${styles.children} ${styles.skeleton}`}>
        <div className={styles.replyPadder}>
          <div className={`${itemStyles.other} ${styles.reply} clouds`} />
        </div>
        <div className={`${styles.comments} ms-sm-1 ms-md-3`}>
          {skeletonChildren
            ? <CommentSkeleton skeletonChildren={skeletonChildren - 1} />
            : null}
        </div>
      </div>
    </div>
  )
}
