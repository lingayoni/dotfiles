#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

export GTK_IM_MODULE=”ibus”
export QT_IM_MODULE=”ibus”
export XMODIFIERS=”@im=ibus”


alias ls='ls --color=auto'
PS1='[\u@\h \W]\$ '
alias pac="sudo /usr/bin/pacman -S"
