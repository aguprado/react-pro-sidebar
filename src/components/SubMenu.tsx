/* eslint-disable @typescript-eslint/no-unused-expressions */
import React from 'react';
import styled, { CSSObject } from '@emotion/styled';
import classnames from 'classnames';
import { SubMenuContent } from './SubMenuContent';
import { StyledMenuLabel } from '../styles/StyledMenuLabel';
import { StyledMenuIcon } from '../styles/StyledMenuIcon';
import { StyledMenuPrefix } from '../styles/StyledMenuPrefix';
import { useMenu } from '../hooks/useMenu';
import { StyledMenuSuffix } from '../styles/StyledMenuSuffix';
import { menuClasses } from '../utils/utilityClasses';
import {
  StyledExpandIcon,
  StyledExpandIconCollapsed,
  StyledExpandIconWrapper,
} from '../styles/StyledExpandIcon';
import { usePopper } from '../hooks/usePopper';
import { MenuButton, menuButtonStyles } from './MenuButton';
import { SidebarContext } from './Sidebar';
import { LevelContext } from './Menu';

export interface SubMenuProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'prefix'> {
  label?: string | React.ReactNode;
  icon?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  active?: boolean;
  disabled?: boolean;
  component?: string | React.ReactElement;
  rootStyles?: CSSObject;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

interface StyledSubMenuProps extends Pick<SubMenuProps, 'rootStyles' | 'active' | 'disabled'> {
  level: number;
  menuItemStyles?: CSSObject;
  collapsed?: boolean;
  rtl?: boolean;
  buttonStyles?: CSSObject;
}

type MenuItemElement =
  | 'root'
  | 'button'
  | 'label'
  | 'prefix'
  | 'suffix'
  | 'icon'
  | 'subMenuContent'
  | 'SubMenuExpandIcon';

const StyledSubMenu = styled.li<StyledSubMenuProps>`
  position: relative;
  width: 100%;

  ${({ menuItemStyles }) => menuItemStyles};

  ${({ rootStyles }) => rootStyles};

  > .${menuClasses.button} {
    ${({ level, disabled, active, collapsed, rtl }) =>
      menuButtonStyles({
        level,
        disabled,
        active,
        collapsed,
        rtl,
      })};

    ${({ buttonStyles }) => buttonStyles};
  }
`;

export const SubMenuFR: React.ForwardRefRenderFunction<HTMLLIElement, SubMenuProps> = (
  {
    children,
    className,
    label,
    icon,
    title,
    prefix,
    suffix,
    open: openControlled,
    defaultOpen,
    active = false,
    disabled = false,
    rootStyles,
    component,
    onOpenChange,
    onClick,
    onKeyUp,
    ...rest
  },
  ref,
) => {
  const level = React.useContext(LevelContext);
  const {
    collapsed,
    rtl,
    transitionDuration: sidebarTransitionDuration,
  } = React.useContext(SidebarContext);
  const { renderExpandIcon, closeOnClick, menuItemStyles, transitionDuration } = useMenu();

  const [open, setOpen] = React.useState(!!defaultOpen);
  const [openWhenCollapsed, setOpenWhenCollapsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const buttonRef = React.useRef<HTMLAnchorElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>();

  const { popperInstance } = usePopper({
    level,
    buttonRef,
    contentRef,
  });

  const expandContent = React.useCallback(() => {
    const target = contentRef.current;
    if (target) {
      const height = target?.querySelector(`.${menuClasses.subMenuContent} > ul`)?.clientHeight;
      target.style.overflow = 'hidden';
      target.style.height = `${height}px`;

      timer.current = setTimeout(() => {
        target.style.overflow = 'auto';
        target.style.height = 'auto';
      }, transitionDuration);
    }
  }, [transitionDuration]);

  const collapseContent = () => {
    const target = contentRef.current;

    if (target) {
      const height = target?.querySelector(`.${menuClasses.subMenuContent} > ul`)?.clientHeight;
      target.style.overflow = 'hidden';
      target.style.height = `${height}px`;
      target.offsetHeight;
      target.style.height = '0px';
    }
  };

  // Se elimina la condición que impedía abrir/cerrar cuando (level === 0 && collapsed).
  const handleSlideToggle = (): void => {
    if (typeof openControlled === 'undefined') {
      clearTimeout(Number(timer.current));
      open ? collapseContent() : expandContent();
      onOpenChange?.(!open);
      setOpen(!open);
    } else {
      onOpenChange?.(!openControlled);
    }
  };

  React.useEffect(() => {
    if (typeof openControlled !== 'undefined') {
      clearTimeout(Number(timer.current));
      !openControlled ? collapseContent() : expandContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ expandContent, label, level, onOpenChange, openControlled]);

  const handleOnClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    onClick?.(event);
    handleSlideToggle();
  };

  const handleOnKeyUp = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    onKeyUp?.(event);
    if (event.key === 'Enter') {
      handleSlideToggle();
    }
  };

  const getSubMenuItemStyles = (element: MenuItemElement): CSSObject | undefined => {
    if (menuItemStyles) {
      const params = { level, disabled, active, isSubmenu: true, open: openControlled ?? open };
      const {
        root: rootElStyles,
        button: buttonElStyles,
        label: labelElStyles,
        icon: iconElStyles,
        prefix: prefixElStyles,
        suffix: suffixElStyles,
        subMenuContent: subMenuContentElStyles,
        SubMenuExpandIcon: SubMenuExpandIconElStyles,
      } = menuItemStyles;

      switch (element) {
        case 'root':
          return typeof rootElStyles === 'function' ? rootElStyles(params) : rootElStyles;

        case 'button':
          return typeof buttonElStyles === 'function' ? buttonElStyles(params) : buttonElStyles;

        case 'label':
          return typeof labelElStyles === 'function' ? labelElStyles(params) : labelElStyles;

        case 'icon':
          return typeof iconElStyles === 'function' ? iconElStyles(params) : iconElStyles;

        case 'prefix':
          return typeof prefixElStyles === 'function' ? prefixElStyles(params) : prefixElStyles;

        case 'suffix':
          return typeof suffixElStyles === 'function' ? suffixElStyles(params) : suffixElStyles;

        case 'SubMenuExpandIcon':
          return typeof SubMenuExpandIconElStyles === 'function'
            ? SubMenuExpandIconElStyles(params)
            : SubMenuExpandIconElStyles;

        case 'subMenuContent':
          return typeof subMenuContentElStyles === 'function'
            ? subMenuContentElStyles(params)
            : subMenuContentElStyles;

        default:
          return undefined;
      }
    }
  };

  React.useEffect(() => {
    setTimeout(() => popperInstance?.update(), sidebarTransitionDuration);
    if (collapsed && level === 0) {
      setOpenWhenCollapsed(false);
    }
  }, [collapsed, level, rtl, sidebarTransitionDuration, popperInstance]);
  
  React.useEffect(() => {
    const openHandler = () => setOpenWhenCollapsed(true);
    const closeHandler = () => setOpenWhenCollapsed(false);
    if (buttonRef.current) {
      // Add the event listener
      buttonRef.current.addEventListener('mouseenter', openHandler);
      buttonRef.current.addEventListener('mouseleave', closeHandler);
    }
  
    return () => {
      // Cleanup: remove the event listener when the component unmounts
      // or if buttonRef changes.
      if (buttonRef.current) {
        buttonRef.current.removeEventListener('mouseenter', openHandler);
        buttonRef.current.removeEventListener('mouseleave', closeHandler);
      }
    };
  }, [buttonRef]);
  
  React.useEffect(() => {
    const openHandler = () => setOpenWhenCollapsed(true);
    const closeHandler = () => setOpenWhenCollapsed(false);
    if (contentRef.current) {
      // Add the event listener
      contentRef.current.addEventListener('mouseenter', openHandler);
      contentRef.current.addEventListener('mouseleave', closeHandler);
      if (closeOnClick) {
        contentRef.current.addEventListener('click', closeHandler);
      }
    }
  
    return () => {
      // Cleanup: remove the event listener when the component unmounts
      // or if contentRef changes.
      if (contentRef.current) {
        contentRef.current.removeEventListener('mouseenter', openHandler);
        contentRef.current.removeEventListener('mouseleave', closeHandler);
        contentRef.current.removeEventListener('click', closeHandler);
      }
    };
  }, [contentRef, closeOnClick]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const sharedClasses = {
    [menuClasses.active]: active,
    [menuClasses.disabled]: disabled,
    [menuClasses.open]: openControlled ?? open,
  };

  return (
    <StyledSubMenu
      ref={ref}
      className={classnames(
        menuClasses.menuItemRoot,
        menuClasses.subMenuRoot,
        sharedClasses,
        className,
      )}
      menuItemStyles={getSubMenuItemStyles('root')}
      level={level}
      collapsed={collapsed}
      rtl={rtl}
      disabled={disabled}
      active={active}
      buttonStyles={getSubMenuItemStyles('button')}
      rootStyles={rootStyles}
    >
      <MenuButton
        data-testid={`${menuClasses.button}-test-id`}
        ref={buttonRef}
        title={title}
        className={classnames(menuClasses.button, sharedClasses)}
        onClick={handleOnClick}
        onKeyUp={handleOnKeyUp}
        component={component}
        tabIndex={0}
        {...rest}
      >
        {icon && (
          <StyledMenuIcon
            rtl={rtl}
            className={classnames(menuClasses.icon, sharedClasses)}
            rootStyles={getSubMenuItemStyles('icon')}
          >
            {icon}
          </StyledMenuIcon>
        )}

        {prefix && (
          <StyledMenuPrefix
            collapsed={collapsed}
            transitionDuration={sidebarTransitionDuration}
            firstLevel={level === 0}
            className={classnames(menuClasses.prefix, sharedClasses)}
            rtl={rtl}
            rootStyles={getSubMenuItemStyles('prefix')}
          >
            {prefix}
          </StyledMenuPrefix>
        )}

        <StyledMenuLabel
          className={classnames(menuClasses.label, sharedClasses)}
          rootStyles={getSubMenuItemStyles('label')}
        >
          {label}
        </StyledMenuLabel>

        {suffix && (
          <StyledMenuSuffix
            collapsed={collapsed}
            transitionDuration={sidebarTransitionDuration}
            firstLevel={level === 0}
            className={classnames(menuClasses.suffix, sharedClasses)}
            rootStyles={getSubMenuItemStyles('suffix')}
          >
            {suffix}
          </StyledMenuSuffix>
        )}

        <StyledExpandIconWrapper
          rtl={rtl}
          className={classnames(menuClasses.SubMenuExpandIcon, sharedClasses)}
          collapsed={collapsed}
          level={level}
          rootStyles={getSubMenuItemStyles('SubMenuExpandIcon')}
        >
          {renderExpandIcon ? (
            renderExpandIcon({
              level,
              disabled,
              active,
              open: openControlled ?? open,
            })
          ) : collapsed && level === 0 ? (
            <StyledExpandIconCollapsed />
          ) : (
            <StyledExpandIcon rtl={rtl} open={openControlled ?? open} />
          )}
        </StyledExpandIconWrapper>
      </MenuButton>
      <SubMenuContent
        ref={contentRef}
        openWhenCollapsed={openWhenCollapsed}
        open={openControlled ?? open}
        firstLevel={level === 0}
        collapsed={collapsed}
        defaultOpen={(openControlled && !mounted) || defaultOpen}
        className={classnames(menuClasses.subMenuContent, sharedClasses)}
        rootStyles={getSubMenuItemStyles('subMenuContent')}
      >
        <LevelContext.Provider value={level + 1}>{children}</LevelContext.Provider>
      </SubMenuContent>
    </StyledSubMenu>
  );
};
export const SubMenu = React.forwardRef<HTMLLIElement, SubMenuProps>(SubMenuFR);
