#
# ~/.bashrc
#
# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
PS1='[\u@\h \W]\$ '
alias pac="sudo /usr/bin/pacman -S"
alias pacu="sudo /usr/bin/pacman -Syu"
alias pacr="sudo /usr/bin/pacman -Rns"
alias pacs="sudo /usr/bin/pacman -Ss"

#for IBus
export GTK_IM_MODULE=ibus
export XMODIFIERS=@im=ibus
export QT_IM_MODULE=ibus