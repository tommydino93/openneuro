import React from 'react'
import { Modal } from './Modal'
import { Button } from '../button/Button'
import { Logo } from '../logo/Logo'
import { AccordionWrap } from '../accordion/AccordionWrap'
import { AccordionTab } from '../accordion/AccordionTab'

import orcidIcon from '../assets/orcid_24x24.png'

export interface UserLoginModalProps {
  isOpen: boolean
  toggle: () => void
  loginUrls: Record<string, string>
  redirectPathParam: string
}

export const UserLoginModal = ({
  isOpen,
  toggle,
  loginUrls,
  redirectPathParam = '',
}: UserLoginModalProps) => {
  return (
    <>
      <Modal isOpen={isOpen} toggle={toggle}>
        <div className="sign-in-modal-header">
          <Logo horizontal dark={true} width="230px" />
          <h2>Sign in</h2>
        </div>
        <div className="sign-in-modal-content">
          <div>
            <a href={loginUrls.google + `${redirectPathParam ? `?redirectPath=${btoa(redirectPathParam)}` : ''}`}>
              <Button
                className="login-button"
                primary
                label="Google"
                icon="fab fa-google"
                iconSize="23px"
                />
            </a>
          </div>
          <div>
            <a href={loginUrls.orcid + `${redirectPathParam ? `?redirectPath=${btoa(redirectPathParam)}` : ''}`}>
              <Button
                className="login-button"
                primary
                label="ORCID"
                imgSrc={orcidIcon}
              />
            </a>
            <AccordionWrap>
              <AccordionTab
                id="orcid-info-accordion"
                label="What is this?"
                accordionStyle="plain"
                children={
                  <>
                    ORCID users are identified and connected to their
                    contributions and affiliations, across disciplines, borders,
                    and time.{' '}
                    <a href="https://orcid.org/content/about-orcid">
                      Learn more
                    </a>
                  </>
                }
              />
            </AccordionWrap>
          </div>
        </div>
      </Modal>
    </>
  )
}
